import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  PenTool, 
  Loader2, 
  Shield, 
  Eye,
  User,
  Calendar,
  RotateCcw
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { CompanyProvider, useCompany } from "@/contexts/CompanyContext";
import { EnhancedPDFViewer } from "@/components/document-signing/EnhancedPDFViewer";
import "@/lib/pdf-config";

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
    expired_at?: string;
    access_count?: number;
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
  placeholder_text?: string;
}

type Step = 'welcome' | 'review' | 'form' | 'signature' | 'confirmation';

function EmployeeDocumentSigningContent() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { companySettings } = useCompany();
  
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [isSigningInProgress, setIsSigningInProgress] = useState(false);
  const [hasBeenSigned, setHasBeenSigned] = useState(false);
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
      
      // Track access for expiration checking
      if (data?.signing_request_recipients?.[0]) {
        await supabase
          .from("signing_request_recipients")
          .update({ 
            access_count: (data.signing_request_recipients[0].access_count || 0) + 1 
          })
          .eq("id", data.signing_request_recipients[0].id);
      }
      
      return data as SigningRequestData;
    },
    enabled: !!token,
  });

  // Fetch template fields
  const { data: templateFields } = useQuery({
    queryKey: ["template-fields", signingData?.template_id],
    queryFn: async () => {
      if (!signingData?.template_id) return [];
      
      const { data, error } = await supabase
        .from("template_fields")
        .select("*")
        .eq("template_id", signingData.template_id)
        .order("page_number");

      if (error) throw error;
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

        // Get page dimensions for coordinate conversion
        const { height: pageHeight } = page.getSize();
        
        // Convert web coordinates to PDF coordinates (Y-axis is flipped in PDF)
        const pdfX = field.x_position;
        const pdfY = pageHeight - field.y_position - field.height;

        if (field.field_type === "signature") {
          // Handle signature fields
          try {
            const signatureData = value.split(',')[1];
            const signatureBytes = Uint8Array.from(atob(signatureData), c => c.charCodeAt(0));
            const signatureImage = await pdfDoc.embedPng(signatureBytes);
            
            page.drawImage(signatureImage, {
              x: pdfX,
              y: pdfY,
              width: field.width,
              height: field.height,
            });
          } catch (error) {
            console.error("Error adding signature:", error);
          }
        } else if (field.field_type === "checkbox") {
          if (value === "true") {
            page.drawText("✓", {
              x: pdfX + 2,
              y: pdfY + 5,
              size: field.height - 4,
            });
          }
        } else {
          page.drawText(value.toString(), {
            x: pdfX,
            y: pdfY + (field.height / 2) - 6,
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

      // Update recipient status to signed and mark as expired
      const { error: updateError } = await supabase
        .from("signing_request_recipients")
        .update({
          status: "signed",
          signed_at: new Date().toISOString(),
          expired_at: new Date().toISOString(),
        })
        .eq("id", recipient.id);

      if (updateError) throw updateError;

      // Create signed document record
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
      setHasBeenSigned(true);
      setCurrentStep('confirmation');
      toast.success("Document signed successfully!");
      queryClient.invalidateQueries({ queryKey: ["signing-request", token] });
    },
    onError: (error: any) => {
      console.error("Error signing document:", error);
      toast.error("Failed to sign document: " + error.message);
      setIsSigningInProgress(false);
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
    if (!templateFields || isSigningInProgress) return;

    if (completeSigning.isPending) {
      toast.error("Document is already being signed, please wait...");
      return;
    }

    // Check required fields
    const requiredFields = templateFields.filter(field => field.is_required);
    const missingFields = requiredFields.filter(field => {
      if (field.field_type === "signature") {
        return !signatures[field.id];
      }
      if (field.field_type === "checkbox") {
        return !fieldValues[field.id];
      }
      return !fieldValues[field.id];
    });

    if (missingFields.length > 0) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSigningInProgress(true);
    completeSigning.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium">Loading document...</p>
            <p className="text-sm text-muted-foreground mt-2">Please wait while we prepare your document</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !signingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Document Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6">The signing link is invalid or has expired.</p>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recipient = signingData.signing_request_recipients[0];
  const isAlreadySigned = recipient?.status === "signed" || hasBeenSigned;
  const isExpired = recipient?.expired_at !== null;

  if (isAlreadySigned || isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600">
              {isExpired ? "Link Expired" : "Already Signed"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <p className="mb-6">
              {isExpired 
                ? "This signing link has expired and is no longer accessible." 
                : "This document has already been signed successfully."
              }
            </p>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate progress
  const steps: Step[] = ['welcome', 'review', 'form', 'signature', 'confirmation'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Calculate form completion
  const requiredFields = templateFields?.filter(field => field.is_required) || [];
  const completedRequiredFields = requiredFields.filter(field => {
    if (field.field_type === "signature") {
      return signatures[field.id];
    }
    return fieldValues[field.id];
  });

  const nextStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {companySettings.logo && (
                <img
                  src={companySettings.logo}
                  alt={companySettings.name}
                  className="h-8 w-8 object-contain"
                />
              )}
              <div>
                <h1 className="font-semibold text-lg">{companySettings.name || 'Document Signing'}</h1>
                <p className="text-sm text-muted-foreground">{signingData.title}</p>
              </div>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Secure
            </Badge>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              {steps.map((step, index) => (
                <span key={step} className={index <= currentStepIndex ? 'text-primary font-medium' : ''}>
                  {step === 'welcome' && 'Welcome'}
                  {step === 'review' && 'Review'}
                  {step === 'form' && 'Complete'}
                  {step === 'signature' && 'Sign'}
                  {step === 'confirmation' && 'Done'}
                </span>
              ))}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {currentStep === 'welcome' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome, {recipient.recipient_name}</CardTitle>
              <p className="text-muted-foreground mt-2">
                You've been requested to review and sign the following document
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">{signingData.document_templates.name}</h3>
                {signingData.message && (
                  <p className="text-sm text-muted-foreground">{signingData.message}</p>
                )}
              </div>
              
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  This process will take approximately 5-10 minutes to complete
                </p>
                <Button onClick={nextStep} size="lg" className="w-full max-w-xs">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'review' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Review Document
                </CardTitle>
                <p className="text-muted-foreground">
                  Please review the document carefully before proceeding
                </p>
              </CardHeader>
            </Card>

            <Card className="h-[600px]">
              <CardContent className="p-0 h-full">
                {pdfUrl && (
                  <EnhancedPDFViewer
                    pdfUrl={pdfUrl}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    scale={scale}
                    onScaleChange={setScale}
                    className="h-full"
                    showToolbar={true}
                    overlayContent={
                      <>
                        {templateFields
                          ?.filter(field => field.page_number === currentPage)
                          .map((field) => (
                            <div
                              key={field.id}
                              className="absolute border-2 border-blue-400 bg-blue-100/80 rounded cursor-pointer flex items-center justify-center text-xs font-medium text-blue-700 hover:bg-blue-200/80 transition-colors"
                              style={{
                                left: field.x_position * scale,
                                top: field.y_position * scale,
                                width: field.width * scale,
                                height: field.height * scale,
                                zIndex: 10
                              }}
                              title={`${field.field_name}${field.is_required ? ' (Required)' : ''}`}
                            >
                              {field.field_type === "signature" ? "✍️" : 
                               field.field_type === "checkbox" ? "☐" :
                               field.field_type === "date" ? "📅" : "📝"}
                            </div>
                          ))}
                      </>
                    }
                  />
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={nextStep}>
                Continue to Form
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'form' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Complete Form Fields
                </CardTitle>
                <p className="text-muted-foreground">
                  Fill in the required information ({completedRequiredFields.length} of {requiredFields.length} completed)
                </p>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Form Fields</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {templateFields && templateFields.length > 0 ? (
                    Object.entries(
                      templateFields
                        .filter(field => field.field_type !== "signature")
                        .reduce((acc, field) => {
                          if (!acc[field.page_number]) acc[field.page_number] = [];
                          acc[field.page_number].push(field);
                          return acc;
                        }, {} as Record<number, TemplateField[]>)
                    ).map(([pageNum, fields]) => (
                      <div key={pageNum}>
                        <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Page {pageNum} Fields
                        </h4>
                        <div className="space-y-3">
                          {fields.map((field) => (
                            <div key={field.id} className="space-y-2">
                              <Label className="text-sm font-medium flex items-center gap-2">
                                {field.field_name}
                                {field.is_required && <span className="text-destructive">*</span>}
                              </Label>
                              
                              {field.field_type === "checkbox" ? (
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={field.id}
                                    checked={fieldValues[field.id] === "true"}
                                    onCheckedChange={(checked) => 
                                      handleFieldChange(field.id, checked ? "true" : "false")
                                    }
                                  />
                                  <Label htmlFor={field.id} className="text-sm">
                                    {field.placeholder_text || "Check this box"}
                                  </Label>
                                </div>
                              ) : field.field_type === "date" ? (
                                <div className="relative">
                                  <Input
                                    type="date"
                                    value={fieldValues[field.id] || ""}
                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                    placeholder={field.placeholder_text}
                                    className="pl-10"
                                  />
                                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                </div>
                              ) : (
                                <Input
                                  type="text"
                                  value={fieldValues[field.id] || ""}
                                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                  placeholder={field.placeholder_text || `Enter ${field.field_name.toLowerCase()}`}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                        {parseInt(pageNum) < Math.max(...Object.keys(templateFields.reduce((acc, field) => {
                          if (!acc[field.page_number]) acc[field.page_number] = [];
                          acc[field.page_number].push(field);
                          return acc;
                        }, {} as Record<number, TemplateField[]>)).map(Number)) && (
                          <Separator className="my-4" />
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No form fields required</p>
                  )}
                </CardContent>
              </Card>

              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-lg">Document Preview</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {pdfUrl && (
                    <div className="h-[400px]">
                      <EnhancedPDFViewer
                        pdfUrl={pdfUrl}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        scale={0.6}
                        className="h-full"
                        showToolbar={false}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={nextStep} 
                disabled={completedRequiredFields.length < requiredFields.length}
              >
                Continue to Signature
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'signature' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5" />
                  Add Your Signature
                </CardTitle>
                <p className="text-muted-foreground">
                  Please sign in the designated areas to complete the document
                </p>
              </CardHeader>
            </Card>

            <div className="space-y-6">
              {templateFields
                ?.filter(field => field.field_type === "signature")
                .map((field) => (
                  <Card key={field.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{field.field_name}</CardTitle>
                      {field.is_required && (
                        <p className="text-sm text-muted-foreground">This signature is required</p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-1">
                        <SignatureCanvas
                          ref={(ref) => signatureRefs.current[field.id] = ref}
                          canvasProps={{
                            width: 600,
                            height: 200,
                            className: 'signature-canvas w-full h-full bg-background rounded'
                          }}
                          onEnd={() => handleSignature(field.id)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => clearSignature(field.id)}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Clear
                        </Button>
                        {signatures[field.id] && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Signed
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSigningInProgress || templateFields?.filter(f => f.field_type === "signature" && f.is_required).some(f => !signatures[f.id])}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSigningInProgress ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing...
                  </>
                ) : (
                  <>
                    <PenTool className="mr-2 h-4 w-4" />
                    Complete Signing
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'confirmation' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">Document Signed Successfully!</CardTitle>
              <p className="text-muted-foreground mt-2">
                Thank you for completing the signing process
              </p>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">What happens next?</h3>
                <p className="text-sm text-muted-foreground">
                  A copy of the signed document has been sent to all relevant parties. 
                  You will receive a confirmation email shortly.
                </p>
              </div>
              
              <Button 
                onClick={() => {
                  window.close();
                  if (!window.closed) {
                    navigate("/", { replace: true });
                  }
                }}
                size="lg"
                className="w-full max-w-xs"
              >
                Close Window
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function EmployeeDocumentSigningView() {
  return (
    <CompanyProvider>
      <EmployeeDocumentSigningContent />
    </CompanyProvider>
  );
}