
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { JobApplicationPortal } from '@/components/job-application/JobApplicationPortal';

export default function PublicHome() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      // Redirect authenticated users to their appropriate dashboard
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/employee-dashboard');
      }
    }
  }, [user, userRole, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show job application portal for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <JobApplicationPortal />
    </div>
  );
}
