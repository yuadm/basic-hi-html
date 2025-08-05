import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Eye, FileText, Edit, Trash2, Send, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Helper function to format dates from YYYY-MM-DD to MM/DD/YYYY
const formatDateDisplay = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Not provided';
  
  // Check if it's already in MM/DD/YYYY format
  if (dateString.includes('/')) return dateString;
  
  // Convert from YYYY-MM-DD to MM/DD/YYYY
  try {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch (error) {
    return dateString; // Return original if conversion fails
  }
};

interface JobApplication {
  id: string;
  personal_info: any;
  availability: any;
  emergency_contact: any;
  employment_history: any;
  reference_info: any;
  skills_experience: any;
  declarations: any;
  consent: any;
  status: string;
  created_at: string;
  updated_at: string;
}

export type JobApplicationSortField = 'applicant_name' | 'position' | 'created_at' | 'postcode' | 'english_proficiency';
export type JobApplicationSortDirection = 'asc' | 'desc';

export function JobApplicationsContent() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<JobApplicationSortField>('created_at');
  const [sortDirection, setSortDirection] = useState<JobApplicationSortDirection>('desc');
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch job applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteApplication = async (id: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setApplications(prev => prev.filter(app => app.id !== id));

      toast({
        title: "Application Deleted",
        description: "The job application has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive",
      });
    }
  };

  const sendReferenceEmail = (application: JobApplication, referenceIndex: number) => {
    const reference = referenceIndex === 1 
      ? application.employment_history?.recentEmployer 
      : application.employment_history?.previousEmployers?.[0];
    
    if (!reference?.email) {
      toast({
        title: "Error",
        description: "No email address found for this reference",
        variant: "destructive",
      });
      return;
    }

    const applicantName = application.personal_info?.fullName || 
                         `${application.personal_info?.firstName || ''} ${application.personal_info?.lastName || ''}`.trim() ||
                         'Unknown Applicant';
    const position = application.personal_info?.positionAppliedFor || 'Unknown Position';
    const referenceName = reference.name || reference.company || 'Reference';
    const referenceCompany = reference.company || 'Unknown Company';
    const referenceAddress = [
      reference.address,
      reference.address2,
      reference.town,
      reference.postcode
    ].filter(Boolean).join(', ') || 'Address not provided';
    
    const subject = `Reference Request for ${applicantName} - ${position} Position`;
    const body = `Dear ${referenceName},

We hope this email finds you well.

We are writing to request a reference for ${applicantName}, who has applied for the position of ${position} with our company. ${applicantName} has listed you as a reference.

Could you please provide information about:
- The nature and duration of your relationship with ${applicantName}
- Their professional capabilities and work ethic
- Any relevant skills or qualities that would be pertinent to this role
- Their reliability and punctuality
- Would you employ this person again? If not, why not?

Your insights would be greatly appreciated and will help us make an informed decision.

Thank you for your time and assistance.

Best regards,
Mohamed Ahmed
HR Department

Reference Details:
Company: ${referenceCompany}
Contact Person: ${referenceName}
Position: ${reference.position || 'Not specified'}
Phone: ${reference.telephone || 'Not provided'}
Address: ${referenceAddress}

Please complete and return this reference as soon as possible.`;

    const mailtoLink = `mailto:${reference.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const handleSort = (field: JobApplicationSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: JobApplicationSortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.personal_info?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.personal_info?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.personal_info?.positionAppliedFor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    let aVal: any;
    let bVal: any;
    
    switch (sortField) {
      case 'applicant_name':
        aVal = a.personal_info?.fullName || '';
        bVal = b.personal_info?.fullName || '';
        break;
      case 'position':
        aVal = a.personal_info?.positionAppliedFor || '';
        bVal = b.personal_info?.positionAppliedFor || '';
        break;
      case 'created_at':
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
        break;
      case 'postcode':
        aVal = a.personal_info?.postcode || '';
        bVal = b.personal_info?.postcode || '';
        break;
      case 'english_proficiency':
        aVal = a.personal_info?.englishProficiency || '';
        bVal = b.personal_info?.englishProficiency || '';
        break;
      default:
        return 0;
    }
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const comparison = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? comparison : -comparison;
    } else {
      const comparison = aVal - bVal;
      return sortDirection === 'asc' ? comparison : -comparison;
    }
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading job applications...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Applications</h1>
          <p className="text-muted-foreground">Manage and review job applications</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{applications.length}</div>
          <div className="text-sm text-muted-foreground">Total Applications</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name, email, or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="interviewed">Interviewed</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications ({filteredApplications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>
                     <Button 
                       variant="ghost" 
                       className="p-0 h-auto font-medium hover:bg-transparent"
                       onClick={() => handleSort('applicant_name')}
                     >
                       Applicant {getSortIcon('applicant_name')}
                     </Button>
                   </TableHead>
                   <TableHead>
                     <Button 
                       variant="ghost" 
                       className="p-0 h-auto font-medium hover:bg-transparent"
                       onClick={() => handleSort('position')}
                     >
                       Position Applied {getSortIcon('position')}
                     </Button>
                   </TableHead>
                   <TableHead>
                     <Button 
                       variant="ghost" 
                       className="p-0 h-auto font-medium hover:bg-transparent"
                       onClick={() => handleSort('created_at')}
                     >
                       Date {getSortIcon('created_at')}
                     </Button>
                   </TableHead>
                   <TableHead>
                     <Button 
                       variant="ghost" 
                       className="p-0 h-auto font-medium hover:bg-transparent"
                       onClick={() => handleSort('postcode')}
                     >
                       Postcode {getSortIcon('postcode')}
                     </Button>
                   </TableHead>
                   <TableHead>
                     <Button 
                       variant="ghost" 
                       className="p-0 h-auto font-medium hover:bg-transparent"
                       onClick={() => handleSort('english_proficiency')}
                     >
                       Proficiency In English {getSortIcon('english_proficiency')}
                     </Button>
                   </TableHead>
                   <TableHead>Actions</TableHead>
                 </TableRow>
               </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div className="font-medium">
                        {application.personal_info?.fullName || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {application.personal_info?.positionAppliedFor || 'Not specified'}
                    </TableCell>
                    <TableCell>
                      {new Date(application.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {application.personal_info?.postcode || 'Not provided'}
                    </TableCell>
                    <TableCell>
                      {application.personal_info?.englishProficiency || 'Not specified'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedApplication(application)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-6xl max-h-[90vh]">
                            <DialogHeader>
                              <DialogTitle>Application Details - {application.personal_info?.fullName}</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="max-h-[75vh]">
                              {selectedApplication && (
                                <ApplicationDetails 
                                  application={selectedApplication} 
                                  onUpdate={fetchApplications}
                                  onSendReferenceEmail={sendReferenceEmail}
                                />
                              )}
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Application</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the application from {application.personal_info?.fullName}? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteApplication(application.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {filteredApplications.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Job applications will appear here once submitted'
            }
          </p>
        </div>
      )}
    </div>
  );
}

function ApplicationDetails({ 
  application, 
  onUpdate, 
  onSendReferenceEmail 
}: { 
  application: JobApplication; 
  onUpdate?: () => void;
  onSendReferenceEmail: (app: JobApplication, refIndex: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(application);
  const { toast } = useToast();

  const downloadApplication = () => {
    const dataStr = JSON.stringify(application, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `job-application-${application.personal_info?.fullName || application.personal_info?.firstName + ' ' + application.personal_info?.lastName || 'unknown'}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Download Started",
      description: "Application data has been downloaded as JSON file",
    });
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({
          personal_info: editData.personal_info,
          availability: editData.availability,
          employment_history: editData.employment_history,
          skills_experience: editData.skills_experience,
          declarations: editData.declarations,
          consent: editData.consent
        })
        .eq('id', editData.id);

      if (error) throw error;

      toast({
        title: "Application Updated",
        description: "The job application has been updated successfully.",
      });

      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive",
      });
    }
  };

  const displayData = isEditing ? editData : application;

  return (
    <div className="space-y-6">
      {/* Header with Edit and Download buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            {displayData.personal_info?.fullName || 
             `${displayData.personal_info?.firstName || ''} ${displayData.personal_info?.lastName || ''}`.trim() ||
             'Unknown Applicant'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Applied: {new Date(displayData.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadApplication}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Download
          </Button>
          {isEditing ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              {isEditing ? (
                <Input
                  value={editData.personal_info?.fullName || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    personal_info: { ...editData.personal_info, fullName: e.target.value }
                  })}
                />
              ) : (
                <p>{displayData.personal_info?.fullName || 
                    `${displayData.personal_info?.firstName || ''} ${displayData.personal_info?.lastName || ''}`.trim() ||
                    'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Title</label>
              {isEditing ? (
                <Input
                  value={editData.personal_info?.title || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    personal_info: { ...editData.personal_info, title: e.target.value }
                  })}
                />
              ) : (
                <p>{displayData.personal_info?.title || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              {isEditing ? (
                <Input
                  value={editData.personal_info?.email || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    personal_info: { ...editData.personal_info, email: e.target.value }
                  })}
                />
              ) : (
                <p>{displayData.personal_info?.email || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              {isEditing ? (
                <Input
                  value={editData.personal_info?.telephone || editData.personal_info?.phone || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    personal_info: { ...editData.personal_info, telephone: e.target.value }
                  })}
                />
              ) : (
                <p>{displayData.personal_info?.telephone || displayData.personal_info?.phone || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Date of Birth</label>
              {isEditing ? (
                <Input
                  type="date"
                  value={editData.personal_info?.dateOfBirth || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    personal_info: { ...editData.personal_info, dateOfBirth: e.target.value }
                  })}
                />
              ) : (
                <p>{formatDateDisplay(displayData.personal_info?.dateOfBirth) || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">National Insurance Number</label>
              {isEditing ? (
                <Input
                  value={editData.personal_info?.nationalInsuranceNumber || editData.personal_info?.niNumber || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    personal_info: { ...editData.personal_info, nationalInsuranceNumber: e.target.value }
                  })}
                />
              ) : (
                <p>{displayData.personal_info?.nationalInsuranceNumber || displayData.personal_info?.niNumber || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Street Address</label>
              {isEditing ? (
                <Input
                  value={editData.personal_info?.streetAddress || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    personal_info: { ...editData.personal_info, streetAddress: e.target.value }
                  })}
                />
              ) : (
                <p>
                  {[
                    displayData.personal_info?.streetAddress,
                    displayData.personal_info?.streetAddress2,
                    displayData.personal_info?.town,
                    displayData.personal_info?.borough,
                    displayData.personal_info?.postcode
                  ].filter(Boolean).join(', ') || 'Not provided'}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Town</label>
              {isEditing ? (
                <Input
                  value={editData.personal_info?.town || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    personal_info: { ...editData.personal_info, town: e.target.value }
                  })}
                />
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Postcode</label>
              {isEditing ? (
                <Input
                  value={editData.personal_info?.postcode || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    personal_info: { ...editData.personal_info, postcode: e.target.value }
                  })}
                />
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Position Applied For</label>
              {isEditing ? (
                <Input
                  value={editData.personal_info?.positionAppliedFor || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    personal_info: { ...editData.personal_info, positionAppliedFor: e.target.value }
                  })}
                />
              ) : (
                <p>{displayData.personal_info?.positionAppliedFor || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">English Proficiency</label>
              {isEditing ? (
                <Select
                  value={editData.personal_info?.englishProficiency || ''}
                  onValueChange={(value) => setEditData({
                    ...editData,
                    personal_info: { ...editData.personal_info, englishProficiency: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select proficiency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="native">Native</SelectItem>
                    <SelectItem value="fluent">Fluent</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p>{displayData.personal_info?.englishProficiency || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Other Languages</label>
              {isEditing ? (
                <Input
                  value={Array.isArray(editData.personal_info?.otherLanguages) 
                    ? editData.personal_info.otherLanguages.join(', ') 
                    : editData.personal_info?.otherLanguages || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    personal_info: { ...editData.personal_info, otherLanguages: e.target.value }
                  })}
                  placeholder="Comma separated languages"
                />
              ) : (
                <p>{
                  Array.isArray(displayData.personal_info?.otherLanguages) 
                    ? displayData.personal_info.otherLanguages.join(', ') 
                    : displayData.personal_info?.otherLanguages || 'None'
                }</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Has DBS</label>
              {isEditing ? (
                <Select
                  value={editData.personal_info?.hasDBS || ''}
                  onValueChange={(value) => setEditData({
                    ...editData,
                    personal_info: { ...editData.personal_info, hasDBS: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select DBS status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p>{displayData.personal_info?.hasDBS || 'Not specified'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Has Car & License</label>
              {isEditing ? (
                <Select
                  value={editData.personal_info?.hasCarAndLicense || editData.personal_info?.hasCarLicense || ''}
                  onValueChange={(value) => setEditData({
                    ...editData,
                    personal_info: { ...editData.personal_info, hasCarAndLicense: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select car/license status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p>{displayData.personal_info?.hasCarAndLicense || displayData.personal_info?.hasCarLicense || 'Not specified'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Confirm Email</label>
              {isEditing ? (
                <Input
                  value={editData.personal_info?.confirmEmail || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    personal_info: { ...editData.personal_info, confirmEmail: e.target.value }
                  })}
                />
              ) : (
                <p>{displayData.personal_info?.confirmEmail || 'Not provided'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Availability & Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Availability & Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Availability</h4>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">Hours Per Week</label>
                  {isEditing ? (
                    <Input
                      value={editData.availability?.hoursPerWeek || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        availability: { ...editData.availability, hoursPerWeek: e.target.value }
                      })}
                    />
                  ) : (
                    <p>{displayData.availability?.hoursPerWeek || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Right to Work</label>
                  {isEditing ? (
                    <Select
                      value={editData.availability?.hasRightToWork || editData.availability?.rightToWork || ''}
                      onValueChange={(value) => setEditData({
                        ...editData,
                        availability: { ...editData.availability, hasRightToWork: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select right to work status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p>{displayData.availability?.hasRightToWork || displayData.availability?.rightToWork || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Selected Shifts</label>
                  {isEditing ? (
                    <Input
                      value={(editData.availability?.selectedShifts || editData.availability?.shifts || []).join(', ')}
                      onChange={(e) => setEditData({
                        ...editData,
                        availability: { ...editData.availability, selectedShifts: e.target.value.split(', ').filter(Boolean) }
                      })}
                      placeholder="Comma separated shifts"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(displayData.availability?.selectedShifts || displayData.availability?.shifts || []).map((shift: string, index: number) => (
                        <Badge key={index} variant="secondary">{shift}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">How Did You Hear About Us</label>
                  {isEditing ? (
                    <Input
                      value={editData.emergency_contact?.howDidYouHear || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        emergency_contact: { ...editData.emergency_contact, howDidYouHear: e.target.value }
                      })}
                    />
                  ) : (
                    <p>{displayData.emergency_contact?.howDidYouHear || 'Not specified'}</p>
                  )}
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Emergency Contact</h4>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  {isEditing ? (
                    <Input
                      value={editData.emergency_contact?.fullName || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        emergency_contact: { ...editData.emergency_contact, fullName: e.target.value }
                      })}
                    />
                  ) : (
                    <p>{displayData.emergency_contact?.fullName || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Relationship</label>
                  {isEditing ? (
                    <Input
                      value={editData.emergency_contact?.relationship || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        emergency_contact: { ...editData.emergency_contact, relationship: e.target.value }
                      })}
                    />
                  ) : (
                    <p>{displayData.emergency_contact?.relationship || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  {isEditing ? (
                    <Input
                      value={editData.emergency_contact?.contactNumber || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        emergency_contact: { ...editData.emergency_contact, contactNumber: e.target.value }
                      })}
                    />
                  ) : (
                    <p>{displayData.emergency_contact?.contactNumber || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employment History */}
      <Card>
        <CardHeader>
          <CardTitle>Employment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Previously Employed</label>
              {isEditing ? (
                <Select
                  value={editData.employment_history?.previouslyEmployed || ''}
                  onValueChange={(value) => setEditData({
                    ...editData,
                    employment_history: { ...editData.employment_history, previouslyEmployed: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p>{displayData.employment_history?.previouslyEmployed || 'Not specified'}</p>
              )}
            </div>
            
            {/* Recent Employer */}
            {(displayData.employment_history?.recentEmployer || isEditing) && (
              <div className="border p-4 rounded-lg">
                <h4 className="font-medium mb-3">Recent Employer</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">Company</label>
                    {isEditing ? (
                      <Input
                        value={editData.employment_history?.recentEmployer?.company || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          employment_history: {
                            ...editData.employment_history,
                            recentEmployer: { ...editData.employment_history?.recentEmployer, company: e.target.value }
                          }
                        })}
                      />
                    ) : (
                      <p>{displayData.employment_history.recentEmployer.company}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Position</label>
                    {isEditing ? (
                      <Input
                        value={editData.employment_history?.recentEmployer?.position || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          employment_history: {
                            ...editData.employment_history,
                            recentEmployer: { ...editData.employment_history?.recentEmployer, position: e.target.value }
                          }
                        })}
                      />
                    ) : (
                      <p>{displayData.employment_history.recentEmployer.position}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Contact Name</label>
                    {isEditing ? (
                      <Input
                        value={editData.employment_history?.recentEmployer?.name || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          employment_history: {
                            ...editData.employment_history,
                            recentEmployer: { ...editData.employment_history?.recentEmployer, name: e.target.value }
                          }
                        })}
                      />
                    ) : (
                      <p>{displayData.employment_history.recentEmployer.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Email</label>
                    {isEditing ? (
                      <Input
                        value={editData.employment_history?.recentEmployer?.email || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          employment_history: {
                            ...editData.employment_history,
                            recentEmployer: { ...editData.employment_history?.recentEmployer, email: e.target.value }
                          }
                        })}
                      />
                    ) : (
                      <p>{displayData.employment_history.recentEmployer.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Phone</label>
                    {isEditing ? (
                      <Input
                        value={editData.employment_history?.recentEmployer?.telephone || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          employment_history: {
                            ...editData.employment_history,
                            recentEmployer: { ...editData.employment_history?.recentEmployer, telephone: e.target.value }
                          }
                        })}
                      />
                    ) : (
                      <p>{displayData.employment_history.recentEmployer.telephone}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Period From</label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editData.employment_history?.recentEmployer?.from || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          employment_history: {
                            ...editData.employment_history,
                            recentEmployer: { ...editData.employment_history?.recentEmployer, from: e.target.value }
                          }
                        })}
                      />
                    ) : (
                      <p>{formatDateDisplay(displayData.employment_history.recentEmployer.from)}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Period To</label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editData.employment_history?.recentEmployer?.to || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          employment_history: {
                            ...editData.employment_history,
                            recentEmployer: { ...editData.employment_history?.recentEmployer, to: e.target.value }
                          }
                        })}
                      />
                    ) : (
                      <p>{formatDateDisplay(displayData.employment_history.recentEmployer.to)}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-400">Address</label>
                    {isEditing ? (
                      <Input
                        value={editData.employment_history?.recentEmployer?.address || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          employment_history: {
                            ...editData.employment_history,
                            recentEmployer: { ...editData.employment_history?.recentEmployer, address: e.target.value }
                          }
                        })}
                        placeholder="Full address"
                      />
                    ) : (
                      <p>
                        {[
                          displayData.employment_history.recentEmployer.address,
                          displayData.employment_history.recentEmployer.address2,
                          displayData.employment_history.recentEmployer.town,
                          displayData.employment_history.recentEmployer.postcode
                        ].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-400">Reason for Leaving</label>
                    {isEditing ? (
                      <Input
                        value={editData.employment_history?.recentEmployer?.reasonForLeaving || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          employment_history: {
                            ...editData.employment_history,
                            recentEmployer: { ...editData.employment_history?.recentEmployer, reasonForLeaving: e.target.value }
                          }
                        })}
                      />
                    ) : (
                      <p>{displayData.employment_history.recentEmployer.reasonForLeaving}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Previous Employments - Read only for now as it's an array */}
            {displayData.employment_history?.previousEmployers && displayData.employment_history.previousEmployers.map((employment: any, index: number) => (
              <div key={index} className="border p-4 rounded-lg">
                <h4 className="font-medium mb-3">Previous Employment {index + 1}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">Company</label>
                    <p>{employment.company}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Position</label>
                    <p>{employment.position}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Contact Name</label>
                    <p>{employment.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Email</label>
                    <p>{employment.email}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Phone</label>
                    <p>{employment.telephone}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Period</label>
                    <p>{formatDateDisplay(employment.from)} to {formatDateDisplay(employment.to)}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-400">Address</label>
                    <p>
                      {[
                        employment.address,
                        employment.address2,
                        employment.town,
                        employment.postcode
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-400">Reason for Leaving</label>
                    <p>{employment.reasonForLeaving}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* References */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>References</CardTitle>
            <div className="flex gap-2">
              {/* Check if references exist and show send buttons accordingly */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSendReferenceEmail(displayData, 1)}
                className="flex items-center gap-1"
                disabled={!displayData.employment_history?.recentEmployer?.email}
                title={displayData.employment_history?.recentEmployer?.email ? "Send email to recent employer" : "No employer email available"}
              >
                <Send className="w-4 h-4" />
                Send Reference 1
              </Button>
              {displayData.employment_history?.previousEmployers?.[0]?.email && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSendReferenceEmail(displayData, 2)}
                  className="flex items-center gap-1"
                >
                  <Send className="w-4 h-4" />
                  Send Reference 2
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Reference 1 */}
            <div className="border p-4 rounded-lg">
              <h4 className="font-medium mb-3">Reference 1</h4>
              {(displayData.reference_info?.reference1 || isEditing) ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">Name</label>
                    {isEditing ? (
                      <Input
                        value={editData.reference_info?.reference1?.name || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          reference_info: {
                            ...editData.reference_info,
                            reference1: { ...editData.reference_info?.reference1, name: e.target.value }
                          }
                        })}
                      />
                    ) : (
                      <p>{displayData.reference_info.reference1.name || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Company</label>
                    {isEditing ? (
                      <Input
                        value={editData.reference_info?.reference1?.company || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          reference_info: {
                            ...editData.reference_info,
                            reference1: { ...editData.reference_info?.reference1, company: e.target.value }
                          }
                        })}
                      />
                    ) : (
                      <p>{displayData.reference_info.reference1.company || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Job Title</label>
                    {isEditing ? (
                      <Input
                        value={editData.reference_info?.reference1?.jobTitle || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          reference_info: {
                            ...editData.reference_info,
                            reference1: { ...editData.reference_info?.reference1, jobTitle: e.target.value }
                          }
                        })}
                      />
                    ) : (
                      <p>{displayData.reference_info.reference1.jobTitle || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Email</label>
                    {isEditing ? (
                      <Input
                        value={editData.reference_info?.reference1?.email || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          reference_info: {
                            ...editData.reference_info,
                            reference1: { ...editData.reference_info?.reference1, email: e.target.value }
                          }
                        })}
                      />
                    ) : (
                      <p>{displayData.reference_info.reference1.email || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Phone</label>
                    {isEditing ? (
                      <Input
                        value={editData.reference_info?.reference1?.contactNumber || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          reference_info: {
                            ...editData.reference_info,
                            reference1: { ...editData.reference_info?.reference1, contactNumber: e.target.value }
                          }
                        })}
                      />
                    ) : (
                      <p>{displayData.reference_info.reference1.contactNumber || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Address</label>
                    {isEditing ? (
                      <Input
                        value={editData.reference_info?.reference1?.address || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          reference_info: {
                            ...editData.reference_info,
                            reference1: { ...editData.reference_info?.reference1, address: e.target.value }
                          }
                        })}
                        placeholder="Full address"
                      />
                    ) : (
                      <p>
                        {[
                          displayData.reference_info.reference1.address,
                          displayData.reference_info.reference1.address2,
                          displayData.reference_info.reference1.town,
                          displayData.reference_info.reference1.postcode
                        ].filter(Boolean).join(', ') || 'Not provided'}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No reference 1 information available</p>
              )}
            </div>
            
            {/* Reference 2 */}
            <div className="border p-4 rounded-lg">
              <h4 className="font-medium mb-3">Reference 2</h4>
              {(displayData.reference_info?.reference2 || isEditing) ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">Name</label>
                    {isEditing ? (
                      <Input
                        value={editData.reference_info?.reference2?.name || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          reference_info: {
                            ...editData.reference_info,
                            reference2: { ...editData.reference_info?.reference2, name: e.target.value }
                          }
                        })}
                      />
                    ) : (
                      <p>{displayData.reference_info.reference2.name || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Company</label>
                    {isEditing ? (
                      <Input
                        value={editData.reference_info?.reference2?.company || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          reference_info: {
                            ...editData.reference_info,
                            reference2: { ...editData.reference_info?.reference2, company: e.target.value }
                          }
                        })}
                      />
                    ) : (
                      <p>{displayData.reference_info.reference2.company || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Job Title</label>
                    {isEditing ? (
                      <Input
                        value={editData.reference_info?.reference2?.jobTitle || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          reference_info: {
                            ...editData.reference_info,
                            reference2: { ...editData.reference_info?.reference2, jobTitle: e.target.value }
                          }
                        })}
                      />
                    ) : (
                      <p>{displayData.reference_info.reference2.jobTitle || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Email</label>
                    {isEditing ? (
                      <Input
                        value={editData.reference_info?.reference2?.email || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          reference_info: {
                            ...editData.reference_info,
                            reference2: { ...editData.reference_info?.reference2, email: e.target.value }
                          }
                        })}
                      />
                    ) : (
                      <p>{displayData.reference_info.reference2.email || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Phone</label>
                    {isEditing ? (
                      <Input
                        value={editData.reference_info?.reference2?.contactNumber || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          reference_info: {
                            ...editData.reference_info,
                            reference2: { ...editData.reference_info?.reference2, contactNumber: e.target.value }
                          }
                        })}
                      />
                    ) : (
                      <p>{displayData.reference_info.reference2.contactNumber || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Address</label>
                    {isEditing ? (
                      <Input
                        value={editData.reference_info?.reference2?.address || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          reference_info: {
                            ...editData.reference_info,
                            reference2: { ...editData.reference_info?.reference2, address: e.target.value }
                          }
                        })}
                        placeholder="Full address"
                      />
                    ) : (
                      <p>
                        {[
                          displayData.reference_info.reference2.address,
                          displayData.reference_info.reference2.address2,
                          displayData.reference_info.reference2.town,
                          displayData.reference_info.reference2.postcode
                        ].filter(Boolean).join(', ') || 'Not provided'}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No reference 2 information available</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills & Experience - Read only for now */}
      {displayData.skills_experience?.skills && (
        <Card>
          <CardHeader>
            <CardTitle>Skills & Experience</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(displayData.skills_experience.skills).map(([skill, value]: [string, any]) => (
                <div key={skill} className="flex justify-between items-center">
                  <span className="capitalize">{skill.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <Badge variant={value === 'good' ? "default" : value === 'basic' ? "secondary" : "outline"}>
                    {String(value).charAt(0).toUpperCase() + String(value).slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Declarations - Read only for now */}
      {displayData.declarations && (
        <Card>
          <CardHeader>
            <CardTitle>Declarations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(displayData.declarations).map(([key, value]: [string, any]) => {
                if (typeof value === 'boolean') {
                  return (
                    <div key={key} className="flex justify-between items-center">
                      <span className="capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <Badge variant={value ? "default" : "secondary"}>
                        {value ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  );
                } else if (value && value !== '') {
                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-sm font-medium text-gray-500 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <p className="text-sm">{String(value)}</p>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consent & Terms */}
      {displayData.consent && (
        <Card>
          <CardHeader>
            <CardTitle>Terms & Consent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(displayData.consent).map(([key, value]: [string, any]) => (
                <div key={key}>
                  <label className="text-sm font-medium text-gray-500 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  {isEditing && key !== 'date' ? (
                    <Input
                      value={String(value)}
                      onChange={(e) => setEditData({
                        ...editData,
                        consent: { ...editData.consent, [key]: e.target.value }
                      })}
                    />
                  ) : (
                    <p>
                      {typeof value === 'boolean' 
                        ? (value ? 'Yes' : 'No') 
                        : key.toLowerCase() === 'date' 
                          ? formatDateDisplay(String(value))
                          : String(value)
                      }
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}