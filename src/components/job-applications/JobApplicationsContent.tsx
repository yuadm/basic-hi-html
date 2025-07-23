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
import { Search, Eye, Calendar, Mail, Phone, MapPin, FileText, User, Edit, Trash2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JobApplication {
  id: string;
  personal_info: any;
  availability: any;
  employment_history: any;
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

  const updateApplicationStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setApplications(prev => 
        prev.map(app => 
          app.id === id ? { ...app, status: newStatus } : app
        )
      );

      toast({
        title: "Status Updated",
        description: `Application status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
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

  const sendReferenceEmail = async (application: JobApplication, referenceIndex: number) => {
    try {
      const reference = referenceIndex === 1 
        ? application.personal_info?.references?.reference1 
        : application.personal_info?.references?.reference2;
      
      if (!reference?.email) {
        toast({
          title: "Error",
          description: "No email address found for this reference",
          variant: "destructive",
        });
        return;
      }

      const referenceAddress = [
        reference.address,
        reference.address2,
        reference.town,
        reference.postcode
      ].filter(Boolean).join(', ');

      const { data, error } = await supabase.functions.invoke('send-reference-email', {
        body: {
          applicantName: application.personal_info?.fullName,
          positionAppliedFor: application.personal_info?.positionAppliedFor,
          referenceEmail: reference.email,
          referenceName: reference.name,
          referenceCompany: reference.company,
          referenceAddress: referenceAddress
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Reference Email Sent",
          description: `Reference request sent to ${reference.name} at ${reference.email}`,
        });
      } else {
        throw new Error(data?.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending reference email:', error);
      toast({
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to send reference email. Please ensure RESEND_API_KEY is configured.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'reviewing': return 'bg-yellow-100 text-yellow-800';
      case 'interviewed': return 'bg-purple-100 text-purple-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
                  <TableHead>Position</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>References</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {application.personal_info?.fullName || 'Unknown'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {application.personal_info?.nationalInsuranceNumber || 'No NI'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {application.personal_info?.positionAppliedFor || 'Not specified'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {application.availability?.hoursPerWeek} hours/week
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3" />
                          {application.personal_info?.email || 'No email'}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3" />
                          {application.personal_info?.telephone || 'No phone'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(application.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(application.created_at).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={application.status} 
                        onValueChange={(value) => updateApplicationStatus(application.id, value)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="reviewing">Reviewing</SelectItem>
                          <SelectItem value="interviewed">Interviewed</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {application.personal_info?.references?.reference1?.email && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendReferenceEmail(application, 1)}
                            className="text-xs"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Ref 1
                          </Button>
                        )}
                        {application.personal_info?.references?.reference2?.email && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendReferenceEmail(application, 2)}
                            className="text-xs"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Ref 2
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedApplication(application)}
                            >
                              <Eye className="w-4 h-4" />
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
                              <Trash2 className="w-4 h-4" />
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
          consent: editData.consent,
          status: editData.status
        })
        .eq('id', application.id);

      if (error) throw error;

      setIsEditing(false);
      onUpdate?.();
      toast({
        title: "Application Updated",
        description: "The application has been updated successfully.",
      });
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
      <div className="flex justify-end gap-2">
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        ) : (
          <>
            <Button onClick={() => setIsEditing(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </>
        )}
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Full Name</label>
            {isEditing ? (
              <Input 
                value={editData.personal_info?.fullName || ''} 
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, fullName: e.target.value }
                }))}
              />
            ) : (
              <p>{displayData.personal_info?.fullName}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Title</label>
            <p>{displayData.personal_info?.title}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p>{displayData.personal_info?.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Phone</label>
            <p>{displayData.personal_info?.telephone}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Date of Birth</label>
            <p>{displayData.personal_info?.dateOfBirth}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Position Applied For</label>
            <p>{displayData.personal_info?.positionAppliedFor}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">National Insurance Number</label>
            <p>{displayData.personal_info?.nationalInsuranceNumber}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">English Proficiency</label>
            <p>{displayData.personal_info?.englishProficiency}</p>
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-500">Address</label>
            <p>
              {[
                displayData.personal_info?.streetAddress,
                displayData.personal_info?.streetAddress2,
                displayData.personal_info?.town,
                displayData.personal_info?.borough,
                displayData.personal_info?.postcode
              ].filter(Boolean).join(', ')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Hours Per Week</label>
              <p>{displayData.availability?.hoursPerWeek}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Right to Work</label>
              <p>{displayData.availability?.hasRightToWork}</p>
            </div>
            {displayData.availability?.selectedShifts && displayData.availability.selectedShifts.length > 0 && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500">Selected Shifts</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {displayData.availability.selectedShifts.map((shift: string, index: number) => (
                    <Badge key={index} variant="secondary">{shift}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* References */}
      <Card>
        <CardHeader>
          <CardTitle>References</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Reference 1 */}
            {displayData.personal_info?.references?.reference1 && (
              <div className="border p-4 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium">Reference 1</h4>
                  {displayData.personal_info.references.reference1.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSendReferenceEmail(displayData, 1)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Reference Email
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">Name</label>
                    <p>{displayData.personal_info.references.reference1.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Company</label>
                    <p>{displayData.personal_info.references.reference1.company}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Job Title</label>
                    <p>{displayData.personal_info.references.reference1.jobTitle}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Email</label>
                    <p>{displayData.personal_info.references.reference1.email}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Contact Number</label>
                    <p>{displayData.personal_info.references.reference1.contactNumber}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Address</label>
                    <p>
                      {[
                        displayData.personal_info.references.reference1.address,
                        displayData.personal_info.references.reference1.address2,
                        displayData.personal_info.references.reference1.town,
                        displayData.personal_info.references.reference1.postcode
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Reference 2 */}
            {displayData.personal_info?.references?.reference2 && (
              <div className="border p-4 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium">Reference 2</h4>
                  {displayData.personal_info.references.reference2.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSendReferenceEmail(displayData, 2)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Reference Email
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">Name</label>
                    <p>{displayData.personal_info.references.reference2.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Company</label>
                    <p>{displayData.personal_info.references.reference2.company}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Job Title</label>
                    <p>{displayData.personal_info.references.reference2.jobTitle}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Email</label>
                    <p>{displayData.personal_info.references.reference2.email}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Contact Number</label>
                    <p>{displayData.personal_info.references.reference2.contactNumber}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Address</label>
                    <p>
                      {[
                        displayData.personal_info.references.reference2.address,
                        displayData.personal_info.references.reference2.address2,
                        displayData.personal_info.references.reference2.town,
                        displayData.personal_info.references.reference2.postcode
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}
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
                  <Badge variant={value ? "default" : "secondary"}>
                    {value ? "Yes" : "No"}
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
              {Object.entries(displayData.declarations).map(([key, value]: [string, any]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <Badge variant={value === 'yes' ? "destructive" : "default"}>
                    {String(value)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consent */}
      {displayData.consent && (
        <Card>
          <CardHeader>
            <CardTitle>Terms & Consent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Consent to Terms</label>
                <p>{displayData.consent.consentToTerms ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Signature</label>
                <p>{displayData.consent.signature}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Date</label>
                <p>{displayData.consent.date}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}