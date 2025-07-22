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

interface EmployeeAuthContextType {
  employee: Employee | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshEmployeeData: () => Promise<void>;
}

const EmployeeAuthContext = createContext<EmployeeAuthContextType | undefined>(undefined);

export function EmployeeAuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEmployeeData = async (user: any) => {
    try {
      const employeeId = user.user_metadata?.employee_id;
      if (!employeeId) {
        console.error('No employee_id found in user metadata');
        signOut();
        return;
      }

      // Fetch employee data using employee_id from user metadata
      const { data: employeeData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (empError) throw empError;

      setEmployee(employeeData);
    } catch (error) {
      console.error('Error fetching employee data:', error);
      signOut();
    }
  };

  const refreshEmployeeData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await fetchEmployeeData(user);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('employee_session'); // Clean up old session data
    setEmployee(null);
    setLoading(false);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Check if this is an employee user
          if (session.user.user_metadata?.role === 'employee') {
            await fetchEmployeeData(session.user);
          } else {
            // Not an employee, sign out
            signOut();
          }
        }
      } catch (error) {
        console.error('Error initializing employee auth:', error);
      } finally {
        setLoading(false);
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user?.user_metadata?.role === 'employee') {
          await fetchEmployeeData(session.user);
          setLoading(false);
        } else {
          setEmployee(null);
          setLoading(false);
        }
      }
    );

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    employee,
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