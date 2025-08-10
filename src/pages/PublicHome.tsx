
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Badge, Building } from 'lucide-react';
import { CompanyProvider, useCompany } from '@/contexts/CompanyContext';

function PublicHomeContent() {
  const { user, userRole, loading } = useAuth();
  const { companySettings, loading: companyLoading } = useCompany();
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
    <div className="min-h-screen bg-gradient-subtle">
      <header className="px-6 py-4 border-b border-border/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
            {!companyLoading && companySettings.logo ? (
              <img src={companySettings.logo} alt={`${companySettings.name} logo`} className="h-10 w-10 object-contain" />
            ) : (
              <Building className="w-6 h-6 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-none">
              {!companyLoading ? companySettings.name : 'Welcome to Our Company'}
            </h1>
            <p className="text-sm text-muted-foreground">{!companyLoading && companySettings.tagline}</p>
          </div>
        </div>
      </header>

      <main className="px-6 py-12">
        <section className="max-w-6xl mx-auto text-center mb-12">
          <p className="text-lg text-muted-foreground">Choose what you need to do today</p>
        </section>

        <section className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Job Application Portal */}
          <Card className="hover:shadow-glow transition-all duration-300 border-border/60">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Apply for a Job</CardTitle>
              <CardDescription>
                Join our team by submitting your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => navigate('/job-application')} className="w-full" size="lg">
                Start Application
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Complete our multi-step form with your details, experience, and skills
              </p>
            </CardContent>
          </Card>

          {/* Employee Portal */}
          <Card className="hover:shadow-glow transition-all duration-300 border-border/60">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Badge className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle className="text-2xl">Employee Portal</CardTitle>
              <CardDescription>
                Current employees: manage your leaves and view your info
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => navigate('/login')} className="w-full" size="lg">
                Login
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Access your dashboard to request leaves, view leave history, and manage documents
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

export default function PublicHome() {
  return (
    <CompanyProvider>
      <PublicHomeContent />
    </CompanyProvider>
  );
}
