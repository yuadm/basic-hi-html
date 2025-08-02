
import { createContext, useContext, ReactNode } from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionsContextType {
  hasPageAccess: (pagePath: string) => boolean;
  hasFeatureAccess: (feature: string) => boolean;
  hasPageAction: (moduleKey: string, action: string) => boolean;
  getAccessibleBranches: () => string[];
  isAdmin: boolean;
  loading: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { userRole } = useAuth();
  const { hasPageAccess, hasFeatureAccess, hasPageAction, getAccessibleBranches, loading } = useUserPermissions();
  
  const isAdmin = userRole === 'admin';

  const value = {
    hasPageAccess: (pagePath: string) => isAdmin || hasPageAccess(pagePath),
    hasFeatureAccess: (feature: string) => isAdmin || hasFeatureAccess(feature),
    hasPageAction: (moduleKey: string, action: string) => isAdmin || hasPageAction(moduleKey, action),
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
