
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

  // Show employee login access for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Employee Portal</CardTitle>
          <CardDescription>
            Login to manage your leave requests and view your information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => navigate('/auth')} 
            className="w-full"
            size="lg"
          >
            Employee Login
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Access your dashboard to request leaves, view leave history, and manage your documents
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
