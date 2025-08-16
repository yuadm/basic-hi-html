
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateTextPicker } from "@/components/ui/date-text-picker";
import { AlertTriangle, CheckCircle, Clock, Edit2, Save, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import countries from "world-countries";
import { getNationalityStatusFromCountry } from "@/utils/nationalityMapping";

const COUNTRY_NAMES = countries.map((c) => c.name.common).sort();

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

interface DocumentViewDialogProps {
  document: Document | null;
  open: boolean;
  onClose: () => void;
}

export function DocumentViewDialog({ document, open, onClose }: DocumentViewDialogProps) {
  const [employeeDocuments, setEmployeeDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingDocument, setEditingDocument] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (document && open) {
      fetchEmployeeDocuments(document.employee_id);
      fetchDocumentTypes();
    }
  }, [document, open]);

  const fetchEmployeeDocuments = async (employeeId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_tracker')
        .select(`
          *,
          employees (name, email, branch),
          document_types (name)
        `)
        .eq('employee_id', employeeId);

      if (error) throw error;
      setEmployeeDocuments(data || []);
    } catch (error) {
      console.error('Error fetching employee documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setDocumentTypes(data || []);
    } catch (error) {
      console.error('Error fetching document types:', error);
    }
  };

  const isValidDate = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) && dateStr !== 'N/A' && dateStr !== 'NOT REQUIRED';
  };

  const startEditing = (doc: Document) => {
    setEditingDocument(doc.id);
    setEditData({
      document_type_id: doc.document_type_id,
      document_number: doc.document_number || '',
      issue_date: doc.issue_date && isValidDate(doc.issue_date) ? new Date(doc.issue_date) : doc.issue_date,
      expiry_date: doc.expiry_date && isValidDate(doc.expiry_date) ? new Date(doc.expiry_date) : doc.expiry_date,
      country: doc.country || '',
      nationality_status: doc.nationality_status || '',
      notes: doc.notes || ''
    });
  };

  const cancelEditing = () => {
    setEditingDocument(null);
    setEditData({});
  };

  const saveDocument = async (docId: string) => {
    try {
      let status = 'valid';
      let expiryDateString = '';
      let issueDateString = '';
      
      // Process expiry date
      if (editData.expiry_date instanceof Date) {
        const expiryDate = editData.expiry_date;
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        
        if (daysUntilExpiry < 0) {
          status = 'expired';
        } else if (daysUntilExpiry <= 30) {
          status = 'expiring';
        }
        expiryDateString = new Date(expiryDate.getTime() - expiryDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      } else {
        expiryDateString = editData.expiry_date as string;
        status = 'valid';
      }

      // Process issue date
      if (editData.issue_date instanceof Date) {
        issueDateString = new Date(editData.issue_date.getTime() - editData.issue_date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      } else {
        issueDateString = editData.issue_date as string;
      }

      const { error } = await supabase
        .from('document_tracker')
        .update({
          document_type_id: editData.document_type_id,
          document_number: editData.document_number || null,
          issue_date: issueDateString || null,
          expiry_date: expiryDateString,
          country: editData.country || null,
          nationality_status: editData.nationality_status || null,
          notes: editData.notes || null,
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', docId);

      if (error) throw error;

      toast({
        title: "Document updated",
        description: "The document has been updated successfully.",
      });

      // Refresh the documents list
      if (document) {
        fetchEmployeeDocuments(document.employee_id);
      }
      
      setEditingDocument(null);
      setEditData({});
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: "Error updating document",
        description: "Could not update document. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!document) return null;

  const getStatusBadge = (document: Document) => {
    // If expiry_date is not a valid date (text entry), show as valid
    if (isNaN(Date.parse(document.expiry_date))) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Valid
      </Badge>;
    }

    const expiryDate = new Date(document.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (daysUntilExpiry < 0) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Expired
      </Badge>;
    } else if (daysUntilExpiry <= 30) {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <Clock className="w-3 h-3 mr-1" />
        Expiring ({daysUntilExpiry} days)
      </Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Valid
      </Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-[800px] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Document Details</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Employee Information - Read Only */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Employee</label>
              <p className="text-sm font-medium">{document.employees?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-sm">{document.employees?.email || 'N/A'}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Branch</label>
            <p className="text-sm">{document.employees?.branch}</p>
          </div>

          {/* All Document Types for Employee - Editable */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">All Document Types</label>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading documents...</p>
            ) : (
              <div className="space-y-4 mt-2">
                {employeeDocuments.map((doc) => (
                  <div key={doc.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{doc.document_types?.name}</h4>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(doc)}
                        {editingDocument === doc.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => saveDocument(doc.id)}>
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEditing}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => startEditing(doc)}>
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {editingDocument === doc.id ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Document Type</label>
                            <Select
                              value={editData.document_type_id}
                              onValueChange={(val) => setEditData(prev => ({ ...prev, document_type_id: val }))}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[70] bg-popover">
                                {documentTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.id}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Document Number</label>
                            <Input
                              value={editData.document_number}
                              onChange={(e) => setEditData(prev => ({ ...prev, document_number: e.target.value }))}
                              className="h-8"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Issue Date</label>
                            <DateTextPicker
                              value={editData.issue_date}
                              onChange={(value) => setEditData(prev => ({ ...prev, issue_date: value }))}
                              placeholder="Pick date or enter text"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Expiry Date</label>
                            <DateTextPicker
                              value={editData.expiry_date}
                              onChange={(value) => setEditData(prev => ({ ...prev, expiry_date: value }))}
                              placeholder="Pick date or enter text"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Country</label>
                            <Select
                              value={editData.country}
                              onValueChange={(val) => {
                                const nationalityStatus = getNationalityStatusFromCountry(val);
                                setEditData(prev => ({ 
                                  ...prev, 
                                  country: val,
                                  nationality_status: nationalityStatus
                                }));
                              }}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent className="z-[70] bg-popover max-h-[200px]">
                                {COUNTRY_NAMES.map((name) => (
                                  <SelectItem key={name} value={name}>
                                    {name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Nationality Status</label>
                            <Input
                              value={editData.nationality_status}
                              onChange={(e) => setEditData(prev => ({ ...prev, nationality_status: e.target.value }))}
                              className="h-8"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Notes</label>
                          <Input
                            value={editData.notes}
                            onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                            className="h-8"
                          />
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Document Number:</span>
                            <p className="font-mono">{doc.document_number || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Expiry Date:</span>
                            <p>{isNaN(Date.parse(doc.expiry_date)) ? doc.expiry_date : new Date(doc.expiry_date).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Issue Date:</span>
                            <p>{doc.issue_date ? (isNaN(Date.parse(doc.issue_date)) ? doc.issue_date : new Date(doc.issue_date).toLocaleDateString()) : 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Country:</span>
                            <p>{doc.country || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="text-sm">
                          <span className="text-muted-foreground">Nationality Status:</span>
                          <p>{doc.nationality_status || 'N/A'}</p>
                        </div>

                        {doc.notes && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Notes:</span>
                            <p className="mt-1">{doc.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {employeeDocuments.length === 0 && (
                  <p className="text-sm text-muted-foreground">No documents found for this employee.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
