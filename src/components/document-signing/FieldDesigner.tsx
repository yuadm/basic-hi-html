import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Type, Calendar, FileSignature, Square, Save, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EnhancedPDFViewer } from "./EnhancedPDFViewer";
import "@/lib/pdf-config"; // Initialize PDF.js configuration

interface TemplateField {
  id?: string;
  field_name: string;
  field_type: "text" | "date" | "signature" | "checkbox";
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  page_number: number;
  is_required: boolean;
  placeholder_text?: string;
  properties?: any;
}

interface FieldDesignerProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  templateUrl: string;
}

export function FieldDesigner({ isOpen, onClose, templateId, templateUrl }: FieldDesignerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [selectedField, setSelectedField] = useState<TemplateField | null>(null);
  const [isCreatingField, setIsCreatingField] = useState(false);
  const [newFieldType, setNewFieldType] = useState<TemplateField["field_type"]>("text");
  const queryClient = useQueryClient();

  // Fetch existing fields
  const { data: existingFields } = useQuery({
    queryKey: ["template-fields", templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("template_fields")
        .select("*")
        .eq("template_id", templateId)
        .order("page_number");
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen
  });

  useEffect(() => {
    if (existingFields) {
      setFields(existingFields.map(field => ({
        id: field.id,
        field_name: field.field_name,
        field_type: field.field_type as TemplateField["field_type"],
        x_position: field.x_position,
        y_position: field.y_position,
        width: field.width,
        height: field.height,
        page_number: field.page_number,
        is_required: field.is_required,
        placeholder_text: field.placeholder_text,
        properties: field.properties
      })));
    }
  }, [existingFields]);

  // Save fields mutation
  const saveFieldsMutation = useMutation({
    mutationFn: async (fieldsToSave: TemplateField[]) => {
      // Delete existing fields for this template
      await supabase
        .from("template_fields")
        .delete()
        .eq("template_id", templateId);

      // Insert new fields
      const { error } = await supabase
        .from("template_fields")
        .insert(
          fieldsToSave.map(field => ({
            template_id: templateId,
            field_name: field.field_name,
            field_type: field.field_type,
            x_position: field.x_position,
            y_position: field.y_position,
            width: field.width,
            height: field.height,
            page_number: field.page_number,
            is_required: field.is_required,
            placeholder_text: field.placeholder_text,
            properties: field.properties
          }))
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-fields", templateId] });
      toast.success("Fields saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save fields: " + error.message);
    }
  });

  const handlePageClick = (event: React.MouseEvent) => {
    if (!isCreatingField) return;

    // Get the click position relative to the PDF viewer
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    const newField: TemplateField = {
      field_name: `${newFieldType}_field_${Date.now()}`,
      field_type: newFieldType,
      x_position: x,
      y_position: y,
      width: newFieldType === "signature" ? 150 : 100,
      height: newFieldType === "signature" ? 60 : 30,
      page_number: currentPage,
      is_required: true
    };

    setFields([...fields, newField]);
    setSelectedField(newField);
    setIsCreatingField(false);
  };

  const fieldIcons = {
    text: Type,
    date: Calendar,
    signature: FileSignature,
    checkbox: Square
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Field Designer</DialogTitle>
          <DialogDescription>
            Click on the PDF to place form fields. Configure field properties in the panel.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Toolbar */}
          <div className="w-64 flex flex-col gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Add Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(fieldIcons).map(([type, Icon]) => (
                  <Button
                    key={type}
                    variant={newFieldType === type && isCreatingField ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setNewFieldType(type as TemplateField["field_type"]);
                      setIsCreatingField(true);
                    }}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Field Properties */}
            {selectedField && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Field Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="fieldName">Field Name</Label>
                    <Input
                      id="fieldName"
                      value={selectedField.field_name}
                      onChange={(e) => {
                        const updated = { ...selectedField, field_name: e.target.value };
                        setSelectedField(updated);
                        setFields(fields.map(f => f === selectedField ? updated : f));
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fieldType">Field Type</Label>
                    <Select
                      value={selectedField.field_type}
                      onValueChange={(value: TemplateField["field_type"]) => {
                        const updated = { ...selectedField, field_type: value };
                        setSelectedField(updated);
                        setFields(fields.map(f => f === selectedField ? updated : f));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="signature">Signature</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="placeholder">Placeholder Text</Label>
                    <Input
                      id="placeholder"
                      value={selectedField.placeholder_text || ""}
                      onChange={(e) => {
                        const updated = { ...selectedField, placeholder_text: e.target.value };
                        setSelectedField(updated);
                        setFields(fields.map(f => f === selectedField ? updated : f));
                      }}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="required"
                      checked={selectedField.is_required}
                      onCheckedChange={(checked) => {
                        const updated = { ...selectedField, is_required: checked };
                        setSelectedField(updated);
                        setFields(fields.map(f => f === selectedField ? updated : f));
                      }}
                    />
                    <Label htmlFor="required">Required</Label>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setFields(fields.filter(f => f !== selectedField));
                      setSelectedField(null);
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Delete Field
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2 mt-auto">
              <Button
                onClick={() => saveFieldsMutation.mutate(fields)}
                disabled={saveFieldsMutation.isPending}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>

            {/* PDF Viewer */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 relative bg-gray-100 rounded">
                <EnhancedPDFViewer
                  pdfUrl={templateUrl}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  scale={scale}
                  onScaleChange={setScale}
                  onPageClick={handlePageClick}
                  className="h-full"
                  overlayContent={
                    <>
                      {/* Render field overlays */}
                      {fields
                        .filter(field => field.page_number === currentPage)
                        .map((field, index) => {
                          const Icon = fieldIcons[field.field_type];
                          return (
                            <div
                              key={index}
                              className={`absolute border-2 bg-blue-100 bg-opacity-50 flex items-center justify-center cursor-pointer ${
                                selectedField === field ? "border-blue-500" : "border-blue-300"
                              }`}
                              style={{
                                left: field.x_position * scale,
                                top: field.y_position * scale,
                                width: field.width * scale,
                                height: field.height * scale,
                                cursor: isCreatingField ? "crosshair" : "pointer"
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedField(field);
                              }}
                            >
                              <Icon className="w-4 h-4 text-blue-600" />
                              <span className="text-xs text-blue-600 ml-1 truncate">
                                {field.field_name}
                              </span>
                            </div>
                          );
                        })}
                    </>
                  }
                />
              </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}