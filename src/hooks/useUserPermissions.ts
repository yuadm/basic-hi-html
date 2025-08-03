
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserPermission {
  permission_type: string;
  permission_key: string;
  granted: boolean;
}

interface UserBranchAccess {
  branch_id: string;
}

export function useUserPermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [branchAccess, setBranchAccess] = useState<UserBranchAccess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserPermissions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserPermissions = async () => {
    try {
      // Fetch user permissions
      const { data: permData, error: permError } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', user?.id);

      if (permError) throw permError;

      // Fetch user branch access
      const { data: branchData, error: branchError } = await supabase
        .from('user_branch_access')
        .select('branch_id')
        .eq('user_id', user?.id);

      if (branchError) throw branchError;

      setPermissions(permData || []);
      setBranchAccess(branchData || []);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      // Set empty arrays if there's an error
      setPermissions([]);
      setBranchAccess([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permissionType: string, permissionKey: string): boolean => {
    const permission = permissions.find(
      p => p.permission_type === permissionType && p.permission_key === permissionKey
    );
    // Default to true if permission not explicitly set
    return permission ? permission.granted : true;
  };

  const hasPageAccess = (pagePath: string): boolean => {
    // For backwards compatibility, check old page_access format first
    const oldPageAccess = hasPermission('page_access', pagePath);
    if (permissions.some(p => p.permission_type === 'page_access' && p.permission_key === pagePath)) {
      return oldPageAccess;
    }
    
    // New format: check if user has 'view' permission for the page module
    const moduleKey = getModuleKeyFromPath(pagePath);
    return hasPageAction(moduleKey, 'view');
  };

  const hasFeatureAccess = (feature: string): boolean => {
    return hasPermission('feature_access', feature);
  };

  const hasPageAction = (moduleKey: string, action: string): boolean => {
    return hasPermission('page_action', `${moduleKey}:${action}`);
  };

  const getModuleKeyFromPath = (path: string): string => {
    const pathModuleMap: Record<string, string> = {
      '/': 'dashboard',
      '/employees': 'employees',
      '/leaves': 'leaves',
      '/documents': 'documents',
      '/document-signing': 'document-signing',
      '/compliance': 'compliance',
      '/reports': 'reports',
      '/job-applications': 'job-applications',
      '/settings': 'settings',
      '/user-management': 'user-management'
    };
    return pathModuleMap[path] || 'dashboard';
  };

  const getAccessibleBranches = (): string[] => {
    return branchAccess.map(ba => ba.branch_id);
  };

  return {
    permissions,
    branchAccess,
    loading,
    hasPermission,
    hasPageAccess,
    hasFeatureAccess,
    hasPageAction,
    getAccessibleBranches,
    refetch: fetchUserPermissions
  };
}
