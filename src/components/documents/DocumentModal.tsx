import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, User, FileText, Check } from "lucide-react";
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
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [currentDocumentType, setCurrentDocumentType] = useState<DocumentType | null>(null);
  const [documentForms, setDocumentForms] = useState<{[key: string]: any}>({});
  const [completedForms, setCompletedForms] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Steps: 0 = Employee Selection (add mode only), 1+ = Document Types
  const steps = mode === 'add' 
    ? ['employee', ...documentTypes.map(dt => dt.id)]
    : [document?.document_type_id || ''];

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && document) {
        // For edit mode, skip employee selection and go straight to document form
        const emp = employees.find(e => e.id === document.employee_id);
        setSelectedEmployee(emp || null);
        setCurrentStep(0);
        setCurrentDocumentType(documentTypes.find(dt => dt.id === document.document_type_id) || null);
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
      } else {
        // Reset for add mode
        setCurrentStep(0);
        setSelectedEmployee(null);
        setCurrentDocumentType(null);
        setDocumentForms({});
        setCompletedForms(new Set());
      }
    }
  }, [open, document, mode, employees, documentTypes]);

  // Update current document type based on step
  useEffect(() => {
    if (mode === 'add' && currentStep > 0 && currentStep <= documentTypes.length) {
      const typeId = steps[currentStep];
      setCurrentDocumentType(documentTypes.find(dt => dt.id === typeId) || null);
    }
  }, [currentStep, documentTypes, mode, steps]);

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
  };

  const handleFormChange = (documentTypeId: string, field: string, value: any) => {
    setDocumentForms(prev => ({
      ...prev,
      [documentTypeId]: {
        ...prev[documentTypeId],
        employee_id: selectedEmployee?.id,
        branch_id: selectedEmployee?.branch_id,
        document_type_id: documentTypeId,
        [field]: value
      }
    }));
  };

  const isFormValid = (typeId: string) => {
    const form = documentForms[typeId];
    return form && form.employee_id && form.expiry_date;
  };

  const handleNext = () => {
    if (mode === 'add' && currentStep === 0) {
      // Moving from employee selection to first document type
      if (!selectedEmployee) {
        toast({
          title: "Select an employee",
          description: "Please select an employee before proceeding.",
          variant: "destructive",
        });
        return;
      }
    } else if (mode === 'add' && currentStep > 0) {
      // Mark current form as completed if valid
      const typeId = steps[currentStep];
      if (isFormValid(typeId)) {
        setCompletedForms(prev => new Set([...prev, typeId]));
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (mode === 'add' && currentStep > 0) {
      // Remove any data for this document type
      const typeId = steps[currentStep];
      setDocumentForms(prev => {
        const newForms = { ...prev };
        delete newForms[typeId];
        return newForms;
      });
      setCompletedForms(prev => {
        const newCompleted = new Set(prev);
        newCompleted.delete(typeId);
        return newCompleted;
      });
    }
    handleNext();
  };

  const handleSave = async () => {
    if (mode === 'edit' && document && currentDocumentType) {
      // Save single document for edit mode
      const formData = documentForms[currentDocumentType.id];
      if (!formData?.expiry_date) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      try {
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
      // Save multiple documents for add mode
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

  const renderEmployeeSelection = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <User className="w-12 h-12 mx-auto text-primary mb-2" />
        <h3 className="text-lg font-semibold">Select Employee</h3>
        <p className="text-sm text-muted-foreground">Choose the employee to add documents for</p>
      </div>
      
      <div className="grid gap-3 max-h-[400px] overflow-y-auto">
        {employees.map((employee) => (
          <Card
            key={employee.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedEmployee?.id === employee.id 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => handleEmployeeSelect(employee)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{employee.name}</div>
                  <div className="text-sm text-muted-foreground">{employee.branch}</div>
                </div>
                <div className="flex gap-1">
                  {employee.sponsored && (
                    <Badge variant="secondary" className="text-xs">Sponsored</Badge>
                  )}
                  {employee.twenty_hours && (
                    <Badge variant="outline" className="text-xs">20hrs</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderDocumentForm = () => {
    if (!currentDocumentType) return null;

    const isCompleted = completedForms.has(currentDocumentType.id);
    const hasData = documentForms[currentDocumentType.id] && 
                   Object.values(documentForms[currentDocumentType.id]).some(val => val);

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FileText className="w-8 h-8 text-primary" />
            {isCompleted && <Check className="w-6 h-6 text-green-500" />}
          </div>
          <h3 className="text-lg font-semibold">{currentDocumentType.name}</h3>
          {selectedEmployee && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="secondary">{selectedEmployee.name}</Badge>
              <Badge variant="outline">{selectedEmployee.branch}</Badge>
            </div>
          )}
        </div>

        <DocumentFormFields
          documentType={currentDocumentType}
          formData={documentForms[currentDocumentType.id] || {}}
          selectedEmployee={selectedEmployee}
          employees={employees}
          branches={branches}
          onChange={(field, value) => handleFormChange(currentDocumentType.id, field, value)}
          onEmployeeChange={mode === 'edit' ? (employee) => setSelectedEmployee(employee) : undefined}
          mode={mode}
        />
      </div>
    );
  };

  const stepTitle = () => {
    if (mode === 'edit') return 'Edit Document';
    if (currentStep === 0) return 'Select Employee';
    return `Document ${currentStep} of ${documentTypes.length}`;
  };

  const isLastStep = currentStep === steps.length - 1;
  const canProceed = mode === 'edit' || 
                    (currentStep === 0 && selectedEmployee) || 
                    (currentStep > 0 && isFormValid(steps[currentStep]));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {stepTitle()}
            {mode === 'add' && (
              <Badge variant="outline" className="text-xs">
                Step {currentStep + 1} of {steps.length}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Update the document information below.'
              : currentStep === 0 
                ? 'First, select the employee you want to add documents for.'
                : 'Fill out the document details. You can skip this type if not needed.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 overflow-y-auto">
          {mode === 'add' && currentStep === 0 ? renderEmployeeSelection() : renderDocumentForm()}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {mode === 'add' && currentStep > 0 && !isLastStep && (
              <Button variant="outline" onClick={handleSkip}>
                Skip
              </Button>
            )}
            
            {isLastStep ? (
              <Button onClick={handleSave} className="bg-gradient-primary hover:opacity-90">
                {mode === 'edit' ? 'Save Changes' : 'Save Documents'}
              </Button>
            ) : (
              <Button 
                onClick={handleNext} 
                disabled={!canProceed}
                className="bg-gradient-primary hover:opacity-90"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}