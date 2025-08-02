
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Badge } from 'lucide-react';

export default function PublicHome() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && userRole !== null) {
      // Redirect authenticated users to their appropriate dashboard
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'user') {
        // For regular users, redirect to admin panel as they should have access to basic features
        navigate('/admin');
      }
    }
  }, [user, userRole, loading, navigate]);

  if (loading || (user && userRole === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show both job application and employee login for non-authenticated users
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Welcome to Our Company
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your gateway to career opportunities and employee services
          </p>
        </div>
        
        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Job Application Portal */}
          <Card className="p-8 hover:shadow-lg transition-all duration-300 border border-border">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold mb-3">Apply for a Job</h2>
                <p className="text-muted-foreground">
                  Join our team! Submit your application through our comprehensive application process.
                </p>
              </div>
              
              <Button 
                onClick={() => navigate('/job-application')} 
                className="w-full"
                size="lg"
              >
                Start Application
              </Button>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Personal & contact information</p>
                <p>• Employment history & references</p>
                <p>• Skills assessment & availability</p>
              </div>
            </div>
          </Card>

          {/* Employee Portal */}
          <Card className="p-8 hover:shadow-lg transition-all duration-300 border border-border">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                <Badge className="w-8 h-8 text-secondary" />
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold mb-3">Employee Portal</h2>
                <p className="text-muted-foreground">
                  Access your employee dashboard to manage leave requests and view your information.
                </p>
              </div>
              
              <Button 
                onClick={() => navigate('/login')} 
                variant="secondary"
                className="w-full"
                size="lg"
              >
                Employee Login
              </Button>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Submit & track leave requests</p>
                <p>• View leave history & balances</p>
                <p>• Manage personal documents</p>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground">
            Need assistance? Contact our HR team for support.
          </p>
        </div>
      </div>
    </div>
  );
}
