
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
    <div className="min-h-screen bg-gradient-subtle relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 pt-12 animate-fade-in">
          <div className="mb-6">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent leading-tight">
              Welcome to Our Company
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Your gateway to career opportunities and employee services. Choose your path below.
            </p>
          </div>
        </div>
        
        {/* Action Cards */}
        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Job Application Portal */}
          <div className="group animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Card className="relative overflow-hidden border-0 shadow-elegant hover:shadow-glow transition-all duration-500 hover:-translate-y-2 bg-card/80 backdrop-blur-sm">
              {/* Card Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <CardHeader className="text-center pb-8 pt-12 relative z-10">
                <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Briefcase className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold mb-4 group-hover:text-primary transition-colors duration-300">
                  Apply for a Job
                </CardTitle>
                <CardDescription className="text-lg leading-relaxed">
                  Start your journey with us! Submit your application through our streamlined process.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="px-8 pb-12 relative z-10">
                <div className="space-y-6">
                  <Button 
                    onClick={() => navigate('/job-application')} 
                    className="w-full h-14 text-lg font-semibold hover-scale"
                    size="lg"
                  >
                    Start Application
                    <Briefcase className="ml-3 w-5 h-5" />
                  </Button>
                  
                  <div className="bg-muted/50 rounded-xl p-6">
                    <h4 className="font-semibold mb-3 text-center">What's Included:</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        Personal information & contact details
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        Employment history & references
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        Skills assessment & availability
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Employee Portal */}
          <div className="group animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Card className="relative overflow-hidden border-0 shadow-elegant hover:shadow-glow transition-all duration-500 hover:-translate-y-2 bg-card/80 backdrop-blur-sm">
              {/* Card Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <CardHeader className="text-center pb-8 pt-12 relative z-10">
                <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Badge className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold mb-4 group-hover:text-secondary transition-colors duration-300">
                  Employee Portal
                </CardTitle>
                <CardDescription className="text-lg leading-relaxed">
                  Access your personalized dashboard for leave management and employee services.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="px-8 pb-12 relative z-10">
                <div className="space-y-6">
                  <Button 
                    onClick={() => navigate('/login')} 
                    variant="secondary"
                    className="w-full h-14 text-lg font-semibold hover-scale"
                    size="lg"
                  >
                    Employee Login
                    <Badge className="ml-3 w-5 h-5" />
                  </Button>
                  
                  <div className="bg-muted/50 rounded-xl p-6">
                    <h4 className="font-semibold mb-3 text-center">Portal Features:</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-secondary rounded-full"></div>
                        Submit & track leave requests
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-secondary rounded-full"></div>
                        View leave history & balances
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-secondary rounded-full"></div>
                        Manage personal documents
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-20 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <p className="text-muted-foreground text-lg">
            Need help? Contact our HR team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
