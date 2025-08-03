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
import { Search, Eye, FileText, Edit, Trash2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export function JobApplicationsContent() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.personal_info?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.personal_info?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.personal_info?.positionAppliedFor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
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
                  <TableHead>Applicant</TableHead>
                  <TableHead>Position Applied</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Postcode</TableHead>
                  <TableHead>Proficiency In English</TableHead>
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
              <p>{displayData.personal_info?.fullName || 
                  `${displayData.personal_info?.firstName || ''} ${displayData.personal_info?.lastName || ''}`.trim() ||
                  'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Title</label>
              <p>{displayData.personal_info?.title || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p>{displayData.personal_info?.email || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p>{displayData.personal_info?.telephone || displayData.personal_info?.phone || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Date of Birth</label>
              <p>{displayData.personal_info?.dateOfBirth || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">National Insurance Number</label>
              <p>{displayData.personal_info?.nationalInsuranceNumber || displayData.personal_info?.niNumber || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Address</label>
              <p>
                {[
                  displayData.personal_info?.streetAddress,
                  displayData.personal_info?.streetAddress2,
                  displayData.personal_info?.town,
                  displayData.personal_info?.borough,
                  displayData.personal_info?.postcode
                ].filter(Boolean).join(', ') || 'Not provided'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Position Applied For</label>
              <p>{displayData.personal_info?.positionAppliedFor || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">English Proficiency</label>
              <p>{displayData.personal_info?.englishProficiency || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Other Languages</label>
              <p>{
                Array.isArray(displayData.personal_info?.otherLanguages) 
                  ? displayData.personal_info.otherLanguages.join(', ') 
                  : displayData.personal_info?.otherLanguages || 'None'
              }</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Has DBS</label>
              <p>{displayData.personal_info?.hasDBS || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Has Car & License</label>
              <p>{displayData.personal_info?.hasCarAndLicense || displayData.personal_info?.hasCarLicense || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Confirm Email</label>
              <p>{displayData.personal_info?.confirmEmail || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Password Field</label>
              <p>{displayData.personal_info?.password ? '***Password Set***' : 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Confirm Password Field</label>
              <p>{displayData.personal_info?.confirmPassword ? '***Confirm Password Set***' : 'Not provided'}</p>
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
                  <p>{displayData.availability?.hoursPerWeek || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Right to Work</label>
                  <p>{displayData.availability?.hasRightToWork || displayData.availability?.rightToWork || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Selected Shifts</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(displayData.availability?.selectedShifts || displayData.availability?.shifts || []).map((shift: string, index: number) => (
                      <Badge key={index} variant="secondary">{shift}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">How Did You Hear About Us</label>
                  <p>{displayData.emergency_contact?.howDidYouHear || 'Not specified'}</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Emergency Contact</h4>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p>{displayData.emergency_contact?.fullName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Relationship</label>
                  <p>{displayData.emergency_contact?.relationship || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p>{displayData.emergency_contact?.contactNumber || 'Not provided'}</p>
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
              <p>{displayData.employment_history?.previouslyEmployed || 'Not specified'}</p>
            </div>
            
            {/* Recent Employer */}
            {displayData.employment_history?.recentEmployer && (
              <div className="border p-4 rounded-lg">
                <h4 className="font-medium mb-3">Recent Employer</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">Company</label>
                    <p>{displayData.employment_history.recentEmployer.company}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Position</label>
                    <p>{displayData.employment_history.recentEmployer.position}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Contact Name</label>
                    <p>{displayData.employment_history.recentEmployer.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Email</label>
                    <p>{displayData.employment_history.recentEmployer.email}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Phone</label>
                    <p>{displayData.employment_history.recentEmployer.telephone}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Period</label>
                    <p>{displayData.employment_history.recentEmployer.from} to {displayData.employment_history.recentEmployer.to}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-400">Address</label>
                    <p>
                      {[
                        displayData.employment_history.recentEmployer.address,
                        displayData.employment_history.recentEmployer.address2,
                        displayData.employment_history.recentEmployer.town,
                        displayData.employment_history.recentEmployer.postcode
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-400">Reason for Leaving</label>
                    <p>{displayData.employment_history.recentEmployer.reasonForLeaving}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Previous Employments Array */}
            {displayData.employment_history?.employments && displayData.employment_history.employments.map((employment: any, index: number) => (
              <div key={index} className="border p-4 rounded-lg">
                <h4 className="font-medium mb-3">Employment {index + 1}</h4>
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
                    <label className="text-xs text-gray-400">Email</label>
                    <p>{employment.email}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Phone</label>
                    <p>{employment.telephone}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Period</label>
                    <p>{employment.fromDate} to {employment.toDate}</p>
                  </div>
                  <div>
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
              {displayData.reference_info?.reference1 ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">Name</label>
                    <p>{displayData.reference_info.reference1.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Company</label>
                    <p>{displayData.reference_info.reference1.company || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Job Title</label>
                    <p>{displayData.reference_info.reference1.jobTitle || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Email</label>
                    <p>{displayData.reference_info.reference1.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Phone</label>
                    <p>{displayData.reference_info.reference1.contactNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Address</label>
                    <p>
                      {[
                        displayData.reference_info.reference1.address,
                        displayData.reference_info.reference1.address2,
                        displayData.reference_info.reference1.town,
                        displayData.reference_info.reference1.postcode
                      ].filter(Boolean).join(', ') || 'Not provided'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No reference 1 information available</p>
              )}
            </div>
            
            {/* Reference 2 */}
            <div className="border p-4 rounded-lg">
              <h4 className="font-medium mb-3">Reference 2</h4>
              {displayData.reference_info?.reference2 ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">Name</label>
                    <p>{displayData.reference_info.reference2.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Company</label>
                    <p>{displayData.reference_info.reference2.company || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Job Title</label>
                    <p>{displayData.reference_info.reference2.jobTitle || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Email</label>
                    <p>{displayData.reference_info.reference2.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Phone</label>
                    <p>{displayData.reference_info.reference2.contactNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Address</label>
                    <p>
                      {[
                        displayData.reference_info.reference2.address,
                        displayData.reference_info.reference2.address2,
                        displayData.reference_info.reference2.town,
                        displayData.reference_info.reference2.postcode
                      ].filter(Boolean).join(', ') || 'Not provided'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No reference 2 information available</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills & Experience */}
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

      {/* Declarations */}
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
                  <p>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}