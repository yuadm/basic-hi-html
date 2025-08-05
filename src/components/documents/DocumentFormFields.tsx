import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateTextPicker } from "@/components/ui/date-text-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface DocumentType {
  id: string;
  name: string;
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

interface Branch {
  id: string;
  name: string;
}

interface DocumentFormFieldsProps {
  documentType: DocumentType;
  formData: any;
  selectedEmployee: Employee | null;
  employees: Employee[];
  branches: Branch[];
  onChange: (field: string, value: any) => void;
  onEmployeeChange?: (employee: Employee) => void;
  mode: 'add' | 'edit';
}

export function DocumentFormFields({
  documentType,
  formData,
  selectedEmployee,
  employees,
  branches,
  onChange,
  onEmployeeChange,
  mode
}: DocumentFormFieldsProps) {
  const isValidDate = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) && dateStr !== 'N/A' && dateStr !== 'NOT REQUIRED';
  };

  // Auto-populate fields when employee or document type changes
  useEffect(() => {
    if (selectedEmployee && mode === 'add') {
      // Auto-populate employee and branch
      onChange('employee_id', selectedEmployee.id);
      onChange('branch_id', selectedEmployee.branch_id);

      // Try to auto-populate from existing document of same type
      const fetchExistingDocument = async () => {
        try {
          const { data: existingDoc, error } = await supabase
            .from('document_tracker')
            .select('*')
            .eq('employee_id', selectedEmployee.id)
            .eq('document_type_id', documentType.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error) throw error;

          if (existingDoc) {
            onChange('document_number', existingDoc.document_number || "");
            onChange('issue_date', existingDoc.issue_date && isValidDate(existingDoc.issue_date) ? new Date(existingDoc.issue_date) : existingDoc.issue_date);
            onChange('country', existingDoc.country || "");
            onChange('nationality_status', existingDoc.nationality_status || "");
            onChange('notes', existingDoc.notes || "");
          }
        } catch (error) {
          console.error('Error fetching existing document:', error);
        }
      };

      fetchExistingDocument();
    }
  }, [selectedEmployee, documentType.id, mode, onChange]);

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee && onEmployeeChange) {
      onEmployeeChange(employee);
    }
  };

  return (
    <div className="space-y-4">
      {/* Document Type Header */}
      <div className="flex items-center justify-between pb-3 border-b">
        <h3 className="text-lg font-semibold">{documentType.name}</h3>
        {selectedEmployee && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{selectedEmployee.name}</Badge>
            <Badge variant="outline">{selectedEmployee.branch}</Badge>
          </div>
        )}
      </div>

      {mode === 'edit' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select
              value={formData.employee_id || ''}
              onValueChange={handleEmployeeSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} ({emp.branch})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Document Type</Label>
            <Input value={documentType.name} disabled />
          </div>
        </div>
      )}

      {(!selectedEmployee && mode === 'add') ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Please select an employee to start filling out this document type.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor={`document_number_${documentType.id}`}>Document Number</Label>
            <Input
              id={`document_number_${documentType.id}`}
              value={formData.document_number || ''}
              onChange={(e) => onChange('document_number', e.target.value)}
              placeholder="e.g., ABC123456"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <DateTextPicker
                value={formData.issue_date || null}
                onChange={(value) => onChange('issue_date', value)}
                placeholder="Pick date or enter text (e.g., N/A)"
              />
            </div>
            <div className="space-y-2">
              <Label>Expiry Date *</Label>
              <DateTextPicker
                value={formData.expiry_date || null}
                onChange={(value) => onChange('expiry_date', value)}
                placeholder="Pick date or enter text (e.g., NOT REQUIRED)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`country_${documentType.id}`}>Country</Label>
              <Input
                id={`country_${documentType.id}`}
                value={formData.country || ''}
                onChange={(e) => onChange('country', e.target.value)}
                placeholder="e.g., United Kingdom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`nationality_status_${documentType.id}`}>Nationality Status</Label>
              <Input
                id={`nationality_status_${documentType.id}`}
                value={formData.nationality_status || ''}
                onChange={(e) => onChange('nationality_status', e.target.value)}
                placeholder="e.g., British Citizen"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`notes_${documentType.id}`}>Notes</Label>
            <Input
              id={`notes_${documentType.id}`}
              value={formData.notes || ''}
              onChange={(e) => onChange('notes', e.target.value)}
              placeholder="Additional information..."
            />
          </div>

          {selectedEmployee && (
            <div className="space-y-3 p-4 border rounded-lg bg-gradient-subtle border-primary/20">
              <h4 className="text-sm font-semibold text-foreground">Employee Status</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`sponsored_${documentType.id}`}
                    checked={selectedEmployee.sponsored || false}
                    disabled
                  />
                  <Label htmlFor={`sponsored_${documentType.id}`} className="text-sm font-medium">
                    Sponsored Employee
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`twenty_hours_${documentType.id}`}
                    checked={selectedEmployee.twenty_hours || false}
                    disabled
                  />
                  <Label htmlFor={`twenty_hours_${documentType.id}`} className="text-sm font-medium">
                    20 Hours Restriction
                  </Label>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}