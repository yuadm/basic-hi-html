
export interface Employee {
  id: string;
  name: string;
  email: string;
  employee_code: string;
  remaining_leave_days: number;
  leave_taken: number;
  branch?: string;
  branch_id?: string;
}

export interface LeaveType {
  id: string;
  name: string;
  reduces_balance: boolean;
}

export interface Leave {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
  notes?: string;
  manager_notes?: string;
  created_at: string;
  employee?: Employee;
  leave_type?: LeaveType;
  employee_name?: string;
  leave_type_name?: string;
  employee_branch_id?: string;
}

export type SortField = 'employee_name' | 'leave_type' | 'start_date' | 'days' | 'status' | 'created_at';
export type SortDirection = 'asc' | 'desc';
export type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
