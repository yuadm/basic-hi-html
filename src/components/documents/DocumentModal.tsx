import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DocumentFormFields } from "./DocumentFormFields";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  employee_id: string;
  document_type_id: string;
  branch_id: string;
  document_number?: string;
  issue_date?: string;
  expiry_date: string;
  status: string;
  notes?: string;
  country?: string;
  nationality_status?: string;
  employees?: {
    name: string;
    email: string;
    branch: string;
  };
  document_types?: {
    name: string;
  };
}

interface Employee {
  id: string;
  name: string;
  email: string;
  branch: string;
  branch_id: string;
  sponsored?: boolean;
  twenty_hours?: boolean;
}

interface DocumentType {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface DocumentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  employees: Employee[];
  documentTypes: DocumentType[];
  branches: Branch[];
  document?: Document | null;
  mode: 'add' | 'edit';
}

export function DocumentModal({ 
  open, 
  onClose, 
  onSave,
  employees,
  documentTypes,
  branches,
  document,
  mode
}: DocumentModalProps) {
  const [activeTab, setActiveTab] = useState<string>('');
  const [documentForms, setDocumentForms] = useState<{[key: string]: any}>({});
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();

  // Initialize tabs when document types are loaded or dialog opens
  useEffect(() => {
    if (open && documentTypes.length > 0) {
      if (mode === 'edit' && document) {
        // For edit mode, set active tab to the document type being edited
        setActiveTab(document.document_type_id);
        setDocumentForms({
          [document.document_type_id]: {
            employee_id: document.employee_id,
            document_type_id: document.document_type_id,
            branch_id: document.branch_id,
            document_number: document.document_number || "",
            issue_date: document.issue_date,
            expiry_date: document.expiry_date,
            country: document.country || "",
            nationality_status: document.nationality_status || "",
            notes: document.notes || ""
          }
        });
        
        const emp = employees.find(e => e.id === document.employee_id);
        setSelectedEmployee(emp || null);
      } else {
        // For add mode, set first document type as active
        setActiveTab(documentTypes[0]?.id || '');
        setDocumentForms({});
        setSelectedEmployee(null);
      }
    }
  }, [open, documentTypes, document, mode, employees]);

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    
    // Update all forms with the selected employee
    const updatedForms = { ...documentForms };
    Object.keys(updatedForms).forEach(typeId => {
      updatedForms[typeId] = {
        ...updatedForms[typeId],
        employee_id: employee.id,
        branch_id: employee.branch_id
      };
    });
    setDocumentForms(updatedForms);
  };

  const handleFormChange = (documentTypeId: string, field: string, value: any) => {
    setDocumentForms(prev => ({
      ...prev,
      [documentTypeId]: {
        ...prev[documentTypeId],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (mode === 'edit' && document) {
      // For edit mode, save only the current document
      const formData = documentForms[activeTab];
      if (!formData?.expiry_date) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      try {
        // Handle date processing
        let status = 'valid';
        let expiryDateString = '';
        let issueDateString = '';
        
        if (formData.expiry_date instanceof Date) {
          const expiryDate = formData.expiry_date;
          const today = new Date();
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
          
          if (daysUntilExpiry < 0) {
            status = 'expired';
          } else if (daysUntilExpiry <= 30) {
            status = 'expiring';
          }
          expiryDateString = new Date(expiryDate.getTime() - expiryDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        } else {
          expiryDateString = formData.expiry_date as string;
          status = 'valid';
        }

        if (formData.issue_date instanceof Date) {
          issueDateString = new Date(formData.issue_date.getTime() - formData.issue_date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        } else {
          issueDateString = formData.issue_date as string;
        }

        const { error } = await supabase
          .from('document_tracker')
          .update({
            employee_id: formData.employee_id,
            document_type_id: formData.document_type_id,
            branch_id: formData.branch_id,
            document_number: formData.document_number || null,
            issue_date: issueDateString || null,
            expiry_date: expiryDateString,
            country: formData.country || null,
            nationality_status: formData.nationality_status || null,
            notes: formData.notes || null,
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', document.id);

        if (error) throw error;

        toast({
          title: "Document updated",
          description: "The document has been updated successfully.",
        });

        onSave();
        onClose();
      } catch (error) {
        console.error('Error updating document:', error);
        toast({
          title: "Error updating document",
          description: "Could not update document. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // For add mode, save all documents that have data
      const documentsToSave = Object.entries(documentForms).filter(([_, formData]) => 
        formData && formData.employee_id && formData.expiry_date
      );

      if (documentsToSave.length === 0) {
        toast({
          title: "No documents to save",
          description: "Please fill in at least one document form.",
          variant: "destructive",
        });
        return;
      }

      try {
        for (const [typeId, formData] of documentsToSave) {
          // Process dates
          let status = 'valid';
          let expiryDateString = '';
          let issueDateString = '';
          
          if (formData.expiry_date instanceof Date) {
            const expiryDate = formData.expiry_date;
            const today = new Date();
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
            
            if (daysUntilExpiry < 0) {
              status = 'expired';
            } else if (daysUntilExpiry <= 30) {
              status = 'expiring';
            }
            expiryDateString = new Date(expiryDate.getTime() - expiryDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
          } else {
            expiryDateString = formData.expiry_date as string;
            status = 'valid';
          }

          if (formData.issue_date instanceof Date) {
            issueDateString = new Date(formData.issue_date.getTime() - formData.issue_date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
          } else {
            issueDateString = formData.issue_date as string;
          }

          const { error } = await supabase
            .from('document_tracker')
            .insert({
              employee_id: formData.employee_id,
              document_type_id: typeId,
              branch_id: formData.branch_id,
              document_number: formData.document_number || null,
              issue_date: issueDateString || null,
              expiry_date: expiryDateString,
              country: formData.country || null,
              nationality_status: formData.nationality_status || null,
              notes: formData.notes || null,
              status
            });

          if (error) throw error;
        }

        toast({
          title: "Documents added",
          description: `Successfully added ${documentsToSave.length} document(s).`,
        });

        onSave();
        onClose();
      } catch (error) {
        console.error('Error adding documents:', error);
        toast({
          title: "Error adding documents",
          description: "Could not add documents. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Document' : 'Add New Documents'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Update the document information below.'
              : 'Add documents for an employee. You can fill out multiple document types at once.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {mode === 'add' && (
            <div className="mb-6 p-4 border rounded-lg bg-gradient-subtle border-primary/20">
              <h4 className="text-sm font-semibold mb-3">Select Employee</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {employees.map((employee) => (
                  <Button
                    key={employee.id}
                    variant={selectedEmployee?.id === employee.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleEmployeeSelect(employee)}
                    className="justify-start text-left"
                  >
                    <div>
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-xs opacity-70">{employee.branch}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${documentTypes.length}, 1fr)` }}>
              {documentTypes.map((type) => (
                <TabsTrigger key={type.id} value={type.id} className="text-xs">
                  {type.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {documentTypes.map((type) => (
              <TabsContent key={type.id} value={type.id} className="mt-4">
                <DocumentFormFields
                  documentType={type}
                  formData={documentForms[type.id] || {}}
                  selectedEmployee={selectedEmployee}
                  employees={employees}
                  branches={branches}
                  onChange={(field, value) => handleFormChange(type.id, field, value)}
                  onEmployeeChange={mode === 'edit' ? undefined : handleEmployeeSelect}
                  mode={mode}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-gradient-primary hover:opacity-90">
            {mode === 'edit' ? 'Save Changes' : 'Add Documents'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}