import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EmployeeLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First, verify employee credentials
      const { data: employeeAccount } = await supabase
        .from('employee_accounts')
        .select(`
          *,
          employees (
            id,
            name,
            email,
            user_id
          )
        `)
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (!employeeAccount) {
        throw new Error('Invalid email or password');
      }

      // Check if account is locked
      if (employeeAccount.locked_until && new Date(employeeAccount.locked_until) > new Date()) {
        throw new Error('Account is temporarily locked. Please try again later.');
      }

      // Verify password using pgcrypto
      const { data: passwordValid } = await supabase.rpc('verify_password', {
        password_input: password,
        password_hash: employeeAccount.password_hash
      });

      if (!passwordValid) {
        // Increment failed login attempts
        await supabase
          .from('employee_accounts')
          .update({ 
            failed_login_attempts: employeeAccount.failed_login_attempts + 1,
            locked_until: employeeAccount.failed_login_attempts >= 4 ? 
              new Date(Date.now() + 30 * 60 * 1000).toISOString() : null // Lock for 30 minutes after 5 failed attempts
          })
          .eq('id', employeeAccount.id);
        
        throw new Error('Invalid email or password');
      }

      // Update last login and reset failed attempts
      await supabase
        .from('employee_accounts')
        .update({
          last_login: new Date().toISOString(),
          failed_login_attempts: 0,
          locked_until: null
        })
        .eq('id', employeeAccount.id);

      // Store employee session data
      localStorage.setItem('employee_session', JSON.stringify({
        employee_id: employeeAccount.employee_id,
        account_id: employeeAccount.id,
        email: employeeAccount.email,
        must_change_password: employeeAccount.must_change_password,
        employee_data: employeeAccount.employees
      }));

      toast({
        title: "Login successful",
        description: `Welcome back, ${employeeAccount.employees?.name}!`,
      });

      // Check if password change is required
      if (employeeAccount.must_change_password) {
        navigate('/employee-change-password');
      } else {
        navigate('/employee-dashboard');
      }

    } catch (error: any) {
      console.error('Employee login error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Employee Portal</CardTitle>
            <CardDescription>
              Sign in with your employee credentials
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmployeeLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="transition-all focus:shadow-glow"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="transition-all focus:shadow-glow"
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Lock className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Having trouble signing in? Contact your administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}