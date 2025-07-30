import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Users, CheckCircle, AlertTriangle, Clock, Shield, Eye, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Filter } from "lucide-react";
import { usePermissions } from "@/contexts/PermissionsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CompliancePeriodView } from "./CompliancePeriodView";
import { AddComplianceRecordModal } from "./AddComplianceRecordModal";
import { EditComplianceRecordModal } from "./EditComplianceRecordModal";
import { format } from "date-fns";

interface ComplianceType {
  id: string;
  name: string;
  description: string;
  frequency: string;
  created_at: string;
}

interface Employee {
  id: string;
  name: string;
  branch: string;
  branch_id?: string;
}

interface Branch {
  id: string;
  name: string;
}

interface ComplianceRecord {
  id: string;
  employee_id: string;
  period_identifier: string;
  completion_date: string;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
  completed_by: string | null;
}

interface EmployeeComplianceStatus {
  employee: Employee;
  record: ComplianceRecord | null;
  status: 'compliant' | 'overdue' | 'due' | 'pending';
  currentPeriod: string;
}

type SortField = 'name' | 'branch' | 'completion_status' | 'completion_date';
type SortDirection = 'asc' | 'desc';

export function ComplianceTypeContent() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getAccessibleBranches, isAdmin } = usePermissions();
  
  const [complianceType, setComplianceType] = useState<ComplianceType | null>(
    location.state?.complianceType || null
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [employeeStatusList, setEmployeeStatusList] = useState<EmployeeComplianceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredStatus, setFilteredStatus] = useState<'compliant' | 'overdue' | 'due' | 'pending' | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [completedByUsers, setCompletedByUsers] = useState<{ [key: string]: { name: string; created_at: string } }>({});

  // Get unique branches for filter
  const uniqueBranches = useMemo(() => {
    const branches = [...new Set(employeeStatusList.map(emp => emp.employee.branch))];
    return branches.sort();
  }, [employeeStatusList]);

  // Filtered and sorted employees
  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = employeeStatusList;

    // Apply status filter first
    if (filteredStatus) {
      filtered = filtered.filter(item => item.status === filteredStatus);
    }

    // Apply branch filter
    if (branchFilter !== 'all') {
      filtered = filtered.filter(item => item.employee.branch === branchFilter);
    }

    // For non-admin users, filter by accessible branches
    const accessibleBranches = getAccessibleBranches();
    if (!isAdmin && accessibleBranches.length > 0) {
      // Filter employees by accessible branches
      filtered = filtered.filter(item => {
        // Map branch name to branch ID and check if it's in accessible branches
        const employeeBranchId = branches.find(b => b.name === item.employee.branch)?.id;
        return accessibleBranches.includes(employeeBranchId || '');
      });
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.employee.name;
          bValue = b.employee.name;
          break;
        case 'branch':
          aValue = a.employee.branch;
          bValue = b.employee.branch;
          break;
        case 'completion_status':
          const statusOrder = { 'compliant': 3, 'due': 2, 'overdue': 1, 'pending': 0 };
          aValue = statusOrder[a.status] || 0;
          bValue = statusOrder[b.status] || 0;
          break;
        case 'completion_date':
          // Safely handle dates and text values for sorting
          aValue = a.record?.completion_date ? (() => {
            const date = new Date(a.record.completion_date);
            return isNaN(date.getTime()) ? 0 : date.getTime();
          })() : 0;
          bValue = b.record?.completion_date ? (() => {
            const date = new Date(b.record.completion_date);
            return isNaN(date.getTime()) ? 0 : date.getTime();
          })() : 0;
          break;
        default:
          aValue = a.employee.name;
          bValue = b.employee.name;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [employeeStatusList, filteredStatus, branchFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4" />
      : <ArrowDown className="w-4 h-4" />;
  };

  useEffect(() => {
    if (!complianceType && id) {
      fetchComplianceType();
    } else {
      fetchData();
    }
  }, [id, complianceType]);

  const fetchComplianceType = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('compliance_types')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setComplianceType(data);
      fetchData();
    } catch (error) {
      console.error('Error fetching compliance type:', error);
      toast({
        title: "Error loading compliance type",
        description: "Could not fetch compliance type details.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      // Fetch all employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, name, branch, branch_id')
        .order('name');

      if (employeesError) throw employeesError;

      // Fetch branches
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('id, name')
        .order('name');

      if (branchesError) throw branchesError;

      // Fetch compliance records for this type
      const { data: recordsData, error: recordsError } = await supabase
        .from('compliance_period_records')
        .select('*')
        .eq('compliance_type_id', id)
        .order('completion_date', { ascending: false });

      if (recordsError) throw recordsError;

      setEmployees(employeesData || []);
      setBranches(branchesData || []);
      setRecords(recordsData || []);
      
      // Fetch user details for completed_by
      if (recordsData && recordsData.length > 0) {
        const userIds = recordsData
          .map(record => record.completed_by)
          .filter(Boolean);
        
        if (userIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('employees')
            .select('id, name')
            .in('id', userIds);

          if (usersError) {
            console.error('Error fetching user data:', usersError);
          } else if (usersData) {
            const usersMap: { [key: string]: { name: string; created_at: string } } = {};
            recordsData.forEach(record => {
              if (record.completed_by) {
                const user = usersData.find(u => u.id === record.completed_by);
                if (user) {
                  usersMap[record.id] = {
                    name: user.name,
                    created_at: record.created_at
                  };
                }
              }
            });
            setCompletedByUsers(usersMap);
          }
        }
      }
      
      // Calculate employee compliance status
      if (complianceType) {
        calculateEmployeeStatus(employeesData || [], recordsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error loading data",
        description: "Could not fetch employee and compliance data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPeriodIdentifier = (frequency: string): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const quarter = Math.ceil(month / 3);

    switch (frequency.toLowerCase()) {
      case 'annual':
        return year.toString();
      case 'monthly':
        return `${year}-${month.toString().padStart(2, '0')}`;
      case 'quarterly':
        return `${year}-Q${quarter}`;
      case 'bi-annual':
        return `${year}-H${month <= 6 ? '1' : '2'}`;
      default:
        return year.toString();
    }
  };

  const calculateEmployeeStatus = (employeesData: Employee[], recordsData: ComplianceRecord[]) => {
    if (!complianceType) return;

    const currentPeriod = getCurrentPeriodIdentifier(complianceType.frequency);
    
    const statusList: EmployeeComplianceStatus[] = employeesData.map(employee => {
      // Find the latest record for this employee in the current period
      const currentRecord = recordsData.find(record => 
        record.employee_id === employee.id && 
        record.period_identifier === currentPeriod
      );

      let status: 'compliant' | 'overdue' | 'due' | 'pending' = 'pending';

      if (currentRecord) {
        // A record is compliant if it has a completion_date (text or valid date) or status is completed
        if (currentRecord.status === 'completed' || currentRecord.completion_date) {
          status = 'compliant';
        } else if (currentRecord.status === 'overdue') {
          status = 'overdue';
        } else {
          status = 'due';
        }
      } else {
        // Check if we're past the period (this would be overdue)
        const now = new Date();
        const isOverdue = isPeriodOverdue(currentPeriod, complianceType.frequency, now);
        status = isOverdue ? 'overdue' : 'due';
      }

      return {
        employee,
        record: currentRecord || null,
        status,
        currentPeriod
      };
    });

    setEmployeeStatusList(statusList);
  };

  const isPeriodOverdue = (periodIdentifier: string, frequency: string, currentDate: Date): boolean => {
    const now = currentDate;
    
    switch (frequency.toLowerCase()) {
      case 'annual': {
        const year = parseInt(periodIdentifier);
        const endOfYear = new Date(year, 11, 31); // December 31st
        return now > endOfYear;
      }
      case 'monthly': {
        const [year, month] = periodIdentifier.split('-').map(Number);
        const endOfMonth = new Date(year, month, 0); // Last day of the month
        return now > endOfMonth;
      }
      case 'quarterly': {
        const [year, quarterStr] = periodIdentifier.split('-');
        const quarter = parseInt(quarterStr.replace('Q', ''));
        const endMonth = quarter * 3; // Q1=3, Q2=6, Q3=9, Q4=12
        const endOfQuarter = new Date(parseInt(year), endMonth, 0); // Last day of quarter
        return now > endOfQuarter;
      }
      case 'bi-annual': {
        const [year, halfStr] = periodIdentifier.split('-');
        const half = parseInt(halfStr.replace('H', ''));
        const endMonth = half === 1 ? 6 : 12;
        const endOfHalf = new Date(parseInt(year), endMonth, 0);
        return now > endOfHalf;
      }
      default:
        return false;
    }
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency.toLowerCase()) {
      case 'weekly':
        return <Calendar className="w-6 h-6 text-primary" />;
      case 'monthly':
        return <Calendar className="w-6 h-6 text-success" />;
      case 'quarterly':
        return <Calendar className="w-6 h-6 text-warning" />;
      case 'bi-annual':
        return <Calendar className="w-6 h-6 text-destructive" />;
      case 'annual':
        return <Calendar className="w-6 h-6 text-destructive" />;
      default:
        return <Clock className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency.toLowerCase()) {
      case 'weekly':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'monthly':
        return 'bg-success/10 text-success border-success/20';
      case 'quarterly':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'bi-annual':
      case 'annual':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusBadge = (status: 'compliant' | 'overdue' | 'due' | 'pending') => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-success/10 text-success border-success/20">Compliant</Badge>;
      case 'overdue':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Overdue</Badge>;
      case 'due':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Due</Badge>;
      case 'pending':
        return <Badge className="bg-muted text-muted-foreground border-border">Pending</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-border">{status}</Badge>;
    }
  };

  const getStatusColor = (status: 'compliant' | 'overdue' | 'due' | 'pending') => {
    switch (status) {
      case 'compliant':
        return 'bg-success/5 border-success/20';
      case 'overdue':
        return 'bg-destructive/5 border-destructive/20';
      case 'due':
        return 'bg-warning/5 border-warning/20';
      default:
        return '';
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('compliance_period_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Record deleted",
        description: "Compliance record has been permanently deleted.",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting compliance record:', error);
      toast({
        title: "Error deleting record",
        description: "Could not delete compliance record. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatusCardClick = (status: 'compliant' | 'overdue' | 'due' | 'pending') => {
    setFilteredStatus(filteredStatus === status ? null : status);
  };

  const getFilteredEmployeeList = () => {
    return filteredAndSortedEmployees;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded-lg w-64"></div>
        <div className="h-48 bg-muted rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!complianceType) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Compliance type not found</h3>
        <Button onClick={() => navigate('/compliance')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Compliance
        </Button>
      </div>
    );
  }

  // Calculate stats from employee status list
  const compliantCount = employeeStatusList.filter(item => item.status === 'compliant').length;
  const overdueCount = employeeStatusList.filter(item => item.status === 'overdue').length;
  const dueCount = employeeStatusList.filter(item => item.status === 'due').length;
  const pendingCount = employeeStatusList.filter(item => item.status === 'pending').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/compliance')}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {complianceType.name}
            </h1>
          </div>
          <p className="text-lg text-muted-foreground ml-11">
            {complianceType.description}
          </p>
        </div>
      </div>

      {/* Compliance Type Details */}
      <Card className="card-premium animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-primary" />
            Compliance Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Frequency</h3>
                <Badge className={`capitalize`}>
                  {complianceType.frequency}
                </Badge>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Current Period</h3>
                <Badge variant="secondary">
                  {getCurrentPeriodIdentifier(complianceType.frequency)}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Employee Compliance</h3>
                <p className="text-2xl font-bold text-foreground">
                  {compliantCount}/{employees.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {employees.length > 0 ? Math.round((compliantCount / employees.length) * 100) : 0}% compliant
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Branch Completion</h3>
                <div className="space-y-2">
                  {uniqueBranches.map((branch) => {
                    const branchEmployees = employeeStatusList.filter(item => item.employee.branch === branch);
                    const branchCompliant = branchEmployees.filter(item => item.status === 'compliant').length;
                    const branchTotal = branchEmployees.length;
                    const percentage = branchTotal > 0 ? Math.round((branchCompliant / branchTotal) * 100) : 0;
                    
                    return (
                      <div key={branch} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{branch}</span>
                        <span className="text-sm font-medium">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-slide-up">
        <Card 
          className={`card-premium border-success/20 bg-gradient-to-br from-success-soft to-card cursor-pointer transition-all duration-300 hover:shadow-glow ${
            filteredStatus === 'compliant' ? 'ring-2 ring-success' : ''
          }`}
          onClick={() => handleStatusCardClick('compliant')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliant</p>
                <p className="text-2xl font-bold text-success">{compliantCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`card-premium border-warning/20 bg-gradient-to-br from-warning-soft to-card cursor-pointer transition-all duration-300 hover:shadow-glow ${
            filteredStatus === 'due' ? 'ring-2 ring-warning' : ''
          }`}
          onClick={() => handleStatusCardClick('due')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Due</p>
                <p className="text-2xl font-bold text-warning">{dueCount}</p>
              </div>
              <Clock className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`card-premium border-destructive/20 bg-gradient-to-br from-destructive-soft to-card cursor-pointer transition-all duration-300 hover:shadow-glow ${
            filteredStatus === 'overdue' ? 'ring-2 ring-destructive' : ''
          }`}
          onClick={() => handleStatusCardClick('overdue')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`card-premium border-muted/20 cursor-pointer transition-all duration-300 hover:shadow-glow ${
            filteredStatus === 'pending' ? 'ring-2 ring-muted-foreground' : ''
          }`}
          onClick={() => handleStatusCardClick('pending')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-muted-foreground">{pendingCount}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Employee Records and Period View */}
      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="employees">Employee Compliance Status</TabsTrigger>
          <TabsTrigger value="periods">Period Records</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-foreground">
                  All Employees - Current Period: {getCurrentPeriodIdentifier(complianceType?.frequency || '')}
                </h2>
                {filteredStatus && (
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredStatus} employees only. Click the card again to show all.
                  </p>
                )}
              </div>
              <AddComplianceRecordModal
                complianceTypeId={complianceType?.id || ''}
                complianceTypeName={complianceType?.name || ''}
                frequency={complianceType?.frequency || ''}
                periodIdentifier={getCurrentPeriodIdentifier(complianceType?.frequency || '')}
                onRecordAdded={fetchData}
                trigger={
                  <Button>
                    Add Compliance Record
                  </Button>
                }
              />
            </div>
            
            {getFilteredEmployeeList().length === 0 ? (
              <Card className="card-premium">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {filteredStatus ? `No ${filteredStatus} employees found` : 'No employees found'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {filteredStatus 
                      ? `No employees have ${filteredStatus} status for this compliance type.`
                      : 'No employees are available for compliance tracking.'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="card-premium">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <Users className="w-6 h-6" />
                      Employee Compliance Status
                    </CardTitle>
                    <div className="flex items-center gap-4">
                      {/* Branch Filter */}
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        <Select value={branchFilter} onValueChange={setBranchFilter}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Filter by branch" />
                          </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="all">All Branches</SelectItem>
                            {/* Only show branches that the user has access to */}
                            {(() => {
                              const accessibleBranches = getAccessibleBranches();
                              const branchesToShow = isAdmin 
                                ? uniqueBranches 
                                : uniqueBranches.filter(branchName => {
                                    const branchId = branches.find(b => b.name === branchName)?.id;
                                    return accessibleBranches.includes(branchId || '');
                                  });
                              
                              return branchesToShow.map((branch) => (
                                <SelectItem key={branch} value={branch}>
                                  {branch}
                                </SelectItem>
                              ));
                            })()}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-2">
                            Employee
                            {getSortIcon('name')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('branch')}
                        >
                          <div className="flex items-center gap-2">
                            Branch
                            {getSortIcon('branch')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('completion_status')}
                        >
                          <div className="flex items-center gap-2">
                            Status
                            {getSortIcon('completion_status')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('completion_date')}
                        >
                          <div className="flex items-center gap-2">
                            Completion Date
                            {getSortIcon('completion_date')}
                          </div>
                        </TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredEmployeeList().map((item) => (
                        <TableRow key={item.employee.id} className={getStatusColor(item.status)}>
                          <TableCell className="font-medium">
                            {item.employee.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {item.employee.branch}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(item.status)}
                          </TableCell>
                          <TableCell>
                            {item.record ? (() => {
                              const date = new Date(item.record.completion_date);
                              return isNaN(date.getTime()) 
                                ? item.record.completion_date 
                                : date.toLocaleDateString();
                            })() : '-'}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={item.record?.notes || ''}>
                              {item.record?.notes || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              {!item.record && (
                                <AddComplianceRecordModal
                                  employeeId={item.employee.id}
                                  employeeName={item.employee.name}
                                  complianceTypeId={complianceType?.id || ''}
                                  complianceTypeName={complianceType?.name || ''}
                                  frequency={complianceType?.frequency || ''}
                                  periodIdentifier={item.currentPeriod}
                                  onRecordAdded={fetchData}
                                  trigger={
                                    <Button variant="outline" size="sm" className="hover-scale">
                                      Add Record
                                    </Button>
                                  }
                                />
                              )}
                              
                              {item.record && (
                                <>
                                  {/* View Dialog */}
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="hover-scale">
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                      <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                          <Eye className="w-5 h-5" />
                                          Compliance Record Details
                                        </DialogTitle>
                                        <DialogDescription>
                                          View details for this compliance record.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <h4 className="font-semibold text-sm text-muted-foreground">Employee</h4>
                                            <p className="font-medium">{item.employee.name}</p>
                                          </div>
                                          <div>
                                            <h4 className="font-semibold text-sm text-muted-foreground">Branch</h4>
                                            <p className="font-medium">{item.employee.branch}</p>
                                          </div>
                                          <div>
                                            <h4 className="font-semibold text-sm text-muted-foreground">Period</h4>
                                            <p className="font-medium">{item.record.period_identifier}</p>
                                          </div>
                                          <div>
                                            <h4 className="font-semibold text-sm text-muted-foreground">Status</h4>
                                            {getStatusBadge(item.status)}
                                          </div>
                                           <div>
                                             <h4 className="font-semibold text-sm text-muted-foreground">Completion Date</h4>
                                             <p className="font-medium">{(() => {
                                               const date = new Date(item.record.completion_date);
                                               return isNaN(date.getTime()) 
                                                 ? item.record.completion_date 
                                                 : date.toLocaleDateString();
                                             })()}</p>
                                           </div>
                                          <div>
                                            <h4 className="font-semibold text-sm text-muted-foreground">Created</h4>
                                            <p className="font-medium">{new Date(item.record.created_at).toLocaleDateString()}</p>
                                          </div>
                                        </div>
                                        {completedByUsers[item.record.id] && (
                                          <div className="border-t pt-4">
                                            <h4 className="font-semibold text-sm text-muted-foreground mb-2">Inputted By</h4>
                                            <div className="bg-muted p-3 rounded-md">
                                              <p className="font-medium">{completedByUsers[item.record.id].name}</p>
                                              <p className="text-sm text-muted-foreground">
                                                {new Date(completedByUsers[item.record.id].created_at).toLocaleDateString()} at{' '}
                                                {new Date(completedByUsers[item.record.id].created_at).toLocaleTimeString()}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                        {item.record.notes && (
                                          <div>
                                            <h4 className="font-semibold text-sm text-muted-foreground mb-2">Notes</h4>
                                            <p className="text-sm bg-muted p-3 rounded-md">{item.record.notes}</p>
                                          </div>
                                        )}
                                      </div>
                                    </DialogContent>
                                  </Dialog>

                                  {/* Edit Record */}
                                  <EditComplianceRecordModal
                                    record={item.record}
                                    employeeName={item.employee.name}
                                    complianceTypeName={complianceType?.name || ''}
                                    frequency={complianceType?.frequency || ''}
                                    onRecordUpdated={fetchData}
                                    trigger={
                                      <Button variant="ghost" size="sm" className="hover-scale">
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    }
                                  />

                                  {/* Delete Dialog */}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="hover-scale text-destructive hover:text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2">
                                          <AlertTriangle className="w-5 h-5 text-destructive" />
                                          Delete Compliance Record?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. This will permanently delete the compliance record for {item.employee.name}.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          className="bg-destructive hover:bg-destructive/90"
                                          onClick={() => handleDeleteRecord(item.record!.id)}
                                        >
                                          Delete Record
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="periods" className="space-y-6">
          <CompliancePeriodView 
            complianceTypeId={complianceType?.id || ''} 
            complianceTypeName={complianceType?.name || ''}
            frequency={complianceType?.frequency || ''} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
