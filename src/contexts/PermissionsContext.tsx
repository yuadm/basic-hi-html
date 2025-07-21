
import { createContext, useContext, ReactNode } from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionsContextType {
  hasPageAccess: (pagePath: string) => boolean;
  hasFeatureAccess: (feature: string) => boolean;
  getAccessibleBranches: () => string[];
  isAdmin: boolean;
  loading: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { userRole } = useAuth();
  const { hasPageAccess, hasFeatureAccess, getAccessibleBranches, loading } = useUserPermissions();
  
  const isAdmin = userRole === 'admin';

  const value = {
    hasPageAccess: (pagePath: string) => isAdmin || hasPageAccess(pagePath),
    hasFeatureAccess: (feature: string) => isAdmin || hasFeatureAccess(feature),
    getAccessibleBranches: () => isAdmin ? [] : getAccessibleBranches(), // Empty array means all branches for admin
    isAdmin,
    loading
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
