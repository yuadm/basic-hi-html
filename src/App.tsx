
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PermissionsProvider, usePermissions } from "@/contexts/PermissionsContext";
import { EmployeeAuthProvider } from "@/contexts/EmployeeAuthContext";
import PublicHome from "./pages/PublicHome";
import Index from "./pages/Index";
import Employees from "./pages/Employees";
import Leaves from "./pages/Leaves";
import Documents from "./pages/Documents";
import Compliance from "./pages/Compliance";
import ComplianceType from "./pages/ComplianceType";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeChangePassword from "./pages/EmployeeChangePassword";
import UnifiedAuth from "./pages/UnifiedAuth";
import JobApplication from "./pages/JobApplication";
import JobApplications from "./pages/JobApplications";
import NotFound from "./pages/NotFound";

// Protected Route component with permission checking
function ProtectedRoute({ children, requiredPage }: { children: React.ReactNode; requiredPage?: string }) {
  const { user, loading: authLoading } = useAuth();
  const { hasPageAccess, loading: permissionsLoading } = usePermissions();
  
  if (authLoading || permissionsLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPage && !hasPageAccess(requiredPage)) {
    return <Navigate to="/admin" replace />;
  }
  
  return <>{children}</>;
}

// Employee routes wrapper with EmployeeAuthProvider
function EmployeeRoutes() {
  return (
    <EmployeeAuthProvider>
      <Routes>
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
        <Route path="/employee-change-password" element={<EmployeeChangePassword />} />
      </Routes>
    </EmployeeAuthProvider>
  );
}

// App content with permissions
function AppContent() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicHome />} />
      <Route path="/login" element={<UnifiedAuth />} />
      <Route path="/job-application" element={<JobApplication />} />
      
      {/* Legacy redirects */}
      <Route path="/auth" element={<Navigate to="/login" replace />} />
      <Route path="/employee-login" element={<Navigate to="/login" replace />} />
      
      {/* Employee routes with their own provider */}
      <Route path="/employee-dashboard" element={
        <EmployeeAuthProvider>
          <EmployeeDashboard />
        </EmployeeAuthProvider>
      } />
      <Route path="/employee-change-password" element={
        <EmployeeAuthProvider>
          <EmployeeChangePassword />
        </EmployeeAuthProvider>
      } />
      
      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      } />
      <Route path="/employees" element={
        <ProtectedRoute requiredPage="/employees">
          <Employees />
        </ProtectedRoute>
      } />
      <Route path="/leaves" element={
        <ProtectedRoute requiredPage="/leaves">
          <Leaves />
        </ProtectedRoute>
      } />
      <Route path="/documents" element={
        <ProtectedRoute requiredPage="/documents">
          <Documents />
        </ProtectedRoute>
      } />
      <Route path="/compliance" element={
        <ProtectedRoute requiredPage="/compliance">
          <Compliance />
        </ProtectedRoute>
      } />
      <Route path="/compliance/:id" element={
        <ProtectedRoute requiredPage="/compliance">
          <ComplianceType />
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute requiredPage="/reports">
          <Reports />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute requiredPage="/settings">
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/user-management" element={
        <ProtectedRoute requiredPage="/user-management">
          <UserManagement />
        </ProtectedRoute>
      } />
      <Route path="/job-applications" element={
        <ProtectedRoute requiredPage="/job-applications">
          <JobApplications />
        </ProtectedRoute>
      } />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PermissionsProvider>
        <CompanyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </CompanyProvider>
      </PermissionsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
