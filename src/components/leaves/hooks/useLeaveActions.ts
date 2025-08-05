import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Leave, Employee, LeaveType } from "../types";

interface UseLeaveActionsProps {
  leaves: Leave[];
  employees: Employee[];
  leaveTypes: LeaveType[];
  refetchData: () => void;
}

export function useLeaveActions({ leaves, employees, leaveTypes, refetchData }: UseLeaveActionsProps) {
  const { toast } = useToast();

  const updateEmployeeLeaveBalance = async (employeeId: string, days: number, operation: 'add' | 'subtract') => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    const currentTaken = employee.leave_taken || 0;
    const currentRemaining = employee.remaining_leave_days || 28;
    
    let newTaken, newRemaining;
    
    if (operation === 'add') {
      // Adding leave (approving a leave)
      newTaken = currentTaken + days;
      newRemaining = Math.max(0, currentRemaining - days);
    } else {
      // Subtracting leave (rejecting or reverting a leave)
      newTaken = Math.max(0, currentTaken - days);
      // Use leave_allowance from database or default to 28
      const leaveAllowance = 28; // Default allowance
      newRemaining = Math.min(leaveAllowance, currentRemaining + days);
    }

    const { error } = await supabase
      .from('employees')
      .update({
        leave_taken: newTaken,
        remaining_leave_days: newRemaining
      })
      .eq('id', employeeId);

    if (error) throw error;
  };

  const addLeave = async (data: {
    employee_id: string;
    leave_type_id: string;
    start_date: string;
    end_date: string;
    notes: string;
    manager_notes: string;
  }) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .insert([{
          ...data,
          status: 'pending'
        }]);

      if (error) throw error;

      toast({
        title: "Leave request submitted",
        description: "The leave request has been submitted for approval.",
      });

      refetchData();
    } catch (error) {
      console.error('Error adding leave:', error);
      toast({
        title: "Error submitting leave",
        description: "Could not submit leave request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateLeave = async (leaveId: string, data: {
    employee_id: string;
    leave_type_id: string;
    start_date: string;
    end_date: string;
    days_requested: number;
    notes: string;
  }) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update(data)
        .eq('id', leaveId);

      if (error) throw error;

      toast({
        title: "Leave updated",
        description: "The leave request has been updated successfully.",
      });

      refetchData();
    } catch (error) {
      console.error('Error updating leave:', error);
      toast({
        title: "Error updating leave",
        description: "Could not update leave request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteLeave = async (leaveId: string) => {
    try {
      // Get leave details before deletion to potentially restore balance
      const leave = leaves.find(l => l.id === leaveId);
      
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', leaveId);

      if (error) throw error;

      // If the leave was approved, restore the employee's leave balance
      if (leave && leave.status === 'approved') {
        const leaveType = leaveTypes.find(lt => lt.id === leave.leave_type_id);
        if (leaveType?.reduces_balance) {
          await updateEmployeeLeaveBalance(leave.employee_id, leave.days_requested, 'subtract');
        }
      }

      toast({
        title: "Leave deleted",
        description: "The leave request has been deleted successfully.",
      });

      refetchData();
    } catch (error) {
      console.error('Error deleting leave:', error);
      toast({
        title: "Error deleting leave",
        description: "Could not delete leave request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateLeaveStatus = async (leaveId: string, newStatus: 'approved' | 'rejected' | 'pending', managerNotes?: string) => {
    try {
      // Get the leave details first
      const leave = leaves.find(l => l.id === leaveId);
      if (!leave) return;

      const previousStatus = leave.status;
      const leaveType = leaveTypes.find(lt => lt.id === leave.leave_type_id);

      // Get current user for audit trail
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update leave status
      const { error: leaveError } = await supabase
        .from('leave_requests')
        .update({ 
          status: newStatus, 
          manager_notes: managerNotes || null,
          approved_date: newStatus === 'approved' ? new Date().toISOString() : null,
          rejected_date: newStatus === 'rejected' ? new Date().toISOString() : null,
          approved_by: newStatus === 'approved' ? user?.id : null,
          rejected_by: newStatus === 'rejected' ? user?.id : null
        })
        .eq('id', leaveId);

      if (leaveError) throw leaveError;

      // Handle leave balance updates for leaves that reduce balance
      if (leaveType?.reduces_balance) {
        // Status change logic
        if (previousStatus === 'approved' && newStatus !== 'approved') {
          // Was approved, now not approved - restore balance
          await updateEmployeeLeaveBalance(leave.employee_id, leave.days_requested, 'subtract');
        } else if (previousStatus !== 'approved' && newStatus === 'approved') {
          // Was not approved, now approved - deduct balance
          await updateEmployeeLeaveBalance(leave.employee_id, leave.days_requested, 'add');
        }
        // If changing from pending to rejected or vice versa, no balance change needed
        // If changing from approved to approved (just updating notes), no balance change needed
      }

      toast({
        title: `Leave ${newStatus}`,
        description: `The leave request has been ${newStatus}.`,
      });

      refetchData();
    } catch (error) {
      console.error('Error updating leave status:', error);
      toast({
        title: "Error updating leave",
        description: "Could not update leave status. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    addLeave,
    updateLeave,
    deleteLeave,
    updateLeaveStatus
  };
}
