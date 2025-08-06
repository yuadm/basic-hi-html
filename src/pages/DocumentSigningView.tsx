import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, FileText } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { EnhancedPDFViewer } from "@/components/document-signing/EnhancedPDFViewer";
import "@/lib/pdf-config"; // Initialize PDF.js configuration

interface SigningRequestData {
  id: string;
  template_id: string;
  title: string;
  message: string;
  status: string;
  document_templates: {
    name: string;
    file_path: string;
  };
  signing_request_recipients: {
    id: string;
    recipient_name: string;
    recipient_email: string;
    status: string;
    access_token: string;
  }[];
}

interface TemplateField {
  id: string;
  field_name: string;
  field_type: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  page_number: number;
  is_required: boolean;
}

export default function DocumentSigningView() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const signatureRefs = useRef<Record<string, SignatureCanvas | null>>({});

  // Fetch signing request data
  const { data: signingData, isLoading, error } = useQuery({
    queryKey: ["signing-request", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signing_requests")
        .select(`
          *,
          document_templates (name, file_path),
          signing_request_recipients (*)
        `)
        .eq("signing_token", token)
        .single();

      if (error) throw error;
      return data as SigningRequestData;
    },
    enabled: !!token,
  });

  // Fetch template fields
  const { data: templateFields } = useQuery({
    queryKey: ["template-fields", signingData?.template_id],
    queryFn: async () => {
      if (!signingData?.template_id) return [];
      
      console.log("Fetching template fields for template_id:", signingData.template_id);
      
      const { data, error } = await supabase
        .from("template_fields")
        .select("*")
        .eq("template_id", signingData.template_id)
        .order("page_number");

      if (error) {
        console.error("Error fetching template fields:", error);
        throw error;
      }
      
      console.log("Template fields data:", data);
      return data as TemplateField[];
    },
    enabled: !!signingData?.template_id,
  });

  // Load PDF when data is available
  useEffect(() => {
    if (signingData?.document_templates?.file_path) {
      const url = `${supabase.storage.from("company-assets").getPublicUrl(signingData.document_templates.file_path).data.publicUrl}`;
      setPdfUrl(url);
    }
  }, [signingData]);

  // Complete signing mutation
  const completeSigning = useMutation({
    mutationFn: async () => {
      if (!signingData || !templateFields) return;

      const recipient = signingData.signing_request_recipients[0];
      if (!recipient) throw new Error("No recipient found");

      // Generate final PDF with filled fields and signatures
      const originalPdfUrl = `${supabase.storage.from("company-assets").getPublicUrl(signingData.document_templates.file_path).data.publicUrl}`;
      const originalPdfResponse = await fetch(originalPdfUrl);
      const originalPdfBytes = await originalPdfResponse.arrayBuffer();

      const pdfDoc = await PDFDocument.load(originalPdfBytes);
      const pages = pdfDoc.getPages();

      // Add field values and signatures to the PDF
      for (const field of templateFields) {
        const page = pages[field.page_number - 1];
        if (!page) continue;

        const value = field.field_type === "signature" ? signatures[field.id] : fieldValues[field.id];
        if (!value) continue;

        if (field.field_type === "signature") {
          // Handle signature fields - convert base64 to image and embed
          try {
            const signatureData = value.split(',')[1]; // Remove data:image/png;base64, prefix
            const signatureBytes = Uint8Array.from(atob(signatureData), c => c.charCodeAt(0));
            const signatureImage = await pdfDoc.embedPng(signatureBytes);
            
            page.drawImage(signatureImage, {
              x: field.x_position,
              y: field.y_position, // Use y_position directly - don't flip
              width: field.width,
              height: field.height,
            });
          } catch (error) {
            console.error("Error adding signature:", error);
          }
        } else if (field.field_type === "checkbox") {
          // Handle checkbox fields
          if (value === "true") {
            page.drawText("✓", {
              x: field.x_position + 2,
              y: field.y_position + 5, // Use y_position directly
              size: field.height - 4,
            });
          }
        } else {
          // Handle text fields
          page.drawText(value.toString(), {
            x: field.x_position,
            y: field.y_position + (field.height / 2) - 6, // Center text vertically
            size: Math.min(12, field.height - 4),
          });
        }
      }

      // Generate the final PDF
      const finalPdfBytes = await pdfDoc.save();
      const finalPdfBlob = new Blob([finalPdfBytes], { type: 'application/pdf' });

      // Upload the final PDF to storage
      const fileName = `${Date.now()}_${signingData.title}_signed.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("company-assets")
        .upload(`signed-documents/${fileName}`, finalPdfBlob);

      if (uploadError) throw uploadError;

      // Update recipient status to signed
      const { error: updateError } = await supabase
        .from("signing_request_recipients")
        .update({
          status: "signed",
          signed_at: new Date().toISOString(),
        })
        .eq("id", recipient.id);

      if (updateError) throw updateError;

      // Create signed document record with field data
      const signedDocumentData = {
        signing_request_id: signingData.id,
        final_document_path: `signed-documents/${fileName}`,
        completion_data: {
          recipient_id: recipient.id,
          field_data: {
            ...fieldValues,
            ...signatures,
          },
        },
        completed_at: new Date().toISOString(),
      };

      const { error: docError } = await supabase
        .from("signed_documents")
        .insert(signedDocumentData);

      if (docError) throw docError;

      // Send completion notification
      await supabase.functions.invoke("send-completion-notification", {
        body: {
          documentTitle: signingData.title,
          recipientName: recipient.recipient_name,
          recipientEmail: recipient.recipient_email,
        },
      });
    },
    onSuccess: () => {
      toast.success("Document signed successfully!");
      queryClient.invalidateQueries({ queryKey: ["signing-request", token] });
    },
    onError: (error: any) => {
      console.error("Error signing document:", error);
      toast.error("Failed to sign document: " + error.message);
    },
  });

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSignature = (fieldId: string) => {
    const canvas = signatureRefs.current[fieldId];
    if (canvas && !canvas.isEmpty()) {
      const dataURL = canvas.toDataURL();
      setSignatures(prev => ({ ...prev, [fieldId]: dataURL }));
    }
  };

  const clearSignature = (fieldId: string) => {
    const canvas = signatureRefs.current[fieldId];
    if (canvas) {
      canvas.clear();
    }
    setSignatures(prev => {
      const newSignatures = { ...prev };
      delete newSignatures[fieldId];
      return newSignatures;
    });
  };

  const handleSubmit = () => {
    if (!templateFields) return;

    // Check required fields
    const requiredFields = templateFields.filter(field => field.is_required);
    const missingFields = requiredFields.filter(field => {
      if (field.field_type === "signature") {
        return !signatures[field.id];
      }
      if (field.field_type === "checkbox") {
        return !fieldValues[field.id]; // Checkbox can be true or false, just check if it's set
      }
      return !fieldValues[field.id];
    });

    if (missingFields.length > 0) {
      toast.error("Please fill all required fields");
      return;
    }

    completeSigning.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !signingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Document Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">The signing link is invalid or has expired.</p>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recipient = signingData.signing_request_recipients[0];
  const isAlreadySigned = recipient?.status === "signed";

  if (isAlreadySigned) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-green-600">Already Signed</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">This document has already been signed.</p>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {signingData.title}
            </CardTitle>
            <p className="text-muted-foreground">
              Please review and sign this document: {signingData.document_templates.name}
            </p>
            {signingData.message && (
              <p className="text-sm italic">{signingData.message}</p>
            )}
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PDF Viewer */}
          <div className="lg:col-span-2">
            <Card className="h-[700px]">
              <CardHeader>
                <CardTitle>Document</CardTitle>
              </CardHeader>
              <CardContent className="h-full p-0">
                {pdfUrl && (
                  <EnhancedPDFViewer
                    pdfUrl={pdfUrl}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    scale={scale}
                    onScaleChange={setScale}
                    className="h-full"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Form Fields */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Complete the Form</CardTitle>
              </CardHeader>
               <CardContent className="space-y-4">
                 {(() => {
                   console.log("Template fields:", templateFields, "Current page:", currentPage);
                   const fieldsForPage = templateFields?.filter(field => field.page_number === currentPage) || [];
                   console.log("Fields for current page:", fieldsForPage);
                   return null;
                 })()}
                 {templateFields?.filter(field => field.page_number === currentPage).map((field) => (
                   <div key={field.id} className="space-y-2">
                     <Label className="flex items-center gap-2">
                       {field.field_name}
                       {field.is_required && <span className="text-red-500">*</span>}
                     </Label>

                      {field.field_type === "signature" ? (
                        <div className="space-y-2">
                          <div className="border border-dashed border-gray-300 rounded p-2">
                            <SignatureCanvas
                              ref={(ref) => (signatureRefs.current[field.id] = ref)}
                              canvasProps={{
                                width: 300,
                                height: 150,
                                className: "w-full h-24 border rounded",
                              }}
                              onEnd={() => handleSignature(field.id)}
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => clearSignature(field.id)}
                            className="w-full"
                          >
                            Clear Signature
                          </Button>
                        </div>
                      ) : field.field_type === "checkbox" ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={field.id}
                            checked={fieldValues[field.id] === "true"}
                            onChange={(e) => handleFieldChange(field.id, e.target.checked.toString())}
                            required={field.is_required}
                            className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                          <label htmlFor={field.id} className="text-sm">
                            {field.field_name}
                          </label>
                        </div>
                      ) : (
                        <Input
                          type={field.field_type === "date" ? "date" : "text"}
                          value={fieldValues[field.id] || ""}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          required={field.is_required}
                          placeholder={`Enter ${field.field_name.toLowerCase()}`}
                        />
                      )}
                    </div>
                  ))}

                <div className="pt-4 space-y-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={completeSigning.isPending}
                    className="w-full"
                  >
                    {completeSigning.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Sign Document
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => navigate("/")}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}