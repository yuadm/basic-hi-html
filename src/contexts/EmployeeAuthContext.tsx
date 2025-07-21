import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Employee {
  id: string;
  name: string;
  email: string;
  branch: string;
  employee_code: string;
  job_title: string;
  employee_type: string;
  leave_allowance: number;
  remaining_leave_days: number;
  leave_taken: number;
}

interface EmployeeAccount {
  id: string;
  employee_id: string;
  email: string;
  must_change_password: boolean;
  last_login: string | null;
}

interface EmployeeAuthContextType {
  employee: Employee | null;
  employeeAccount: EmployeeAccount | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshEmployeeData: () => Promise<void>;
}

const EmployeeAuthContext = createContext<EmployeeAuthContextType | undefined>(undefined);

export function EmployeeAuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [employeeAccount, setEmployeeAccount] = useState<EmployeeAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEmployeeData = async (employeeId: string, accountId: string) => {
    try {
      // Fetch employee data
      const { data: employeeData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (empError) throw empError;

      // Fetch employee account data
      const { data: accountData, error: accError } = await supabase
        .from('employee_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (accError) throw accError;

      setEmployee(employeeData);
      setEmployeeAccount(accountData);
    } catch (error) {
      console.error('Error fetching employee data:', error);
      signOut();
    }
  };

  const refreshEmployeeData = async () => {
    const sessionData = localStorage.getItem('employee_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      await fetchEmployeeData(session.employee_id, session.account_id);
    }
  };

  const signOut = async () => {
    localStorage.removeItem('employee_session');
    setEmployee(null);
    setEmployeeAccount(null);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const sessionData = localStorage.getItem('employee_session');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          await fetchEmployeeData(session.employee_id, session.account_id);
        }
      } catch (error) {
        console.error('Error initializing employee auth:', error);
        localStorage.removeItem('employee_session');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value = {
    employee,
    employeeAccount,
    loading,
    signOut,
    refreshEmployeeData
  };

  return (
    <EmployeeAuthContext.Provider value={value}>
      {children}
    </EmployeeAuthContext.Provider>
  );
}

export function useEmployeeAuth() {
  const context = useContext(EmployeeAuthContext);
  if (context === undefined) {
    throw new Error('useEmployeeAuth must be used within an EmployeeAuthProvider');
  }
  return context;
}