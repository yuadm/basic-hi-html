
import { useState, useEffect } from "react";
import { Calendar, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LeaveTypeManagement } from "./LeaveTypeManagement";

interface LeaveSettingsData {
  id?: string;
  default_leave_days: number;
  carry_over_enabled: boolean;
  manager_approval_required: boolean;
  max_carry_over_days: number;
}

export function LeaveSettings() {
  const [settings, setSettings] = useState<LeaveSettingsData>({
    default_leave_days: 28,
    carry_over_enabled: true,
    manager_approval_required: true,
    max_carry_over_days: 5,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_settings')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching leave settings:', error);
        return;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching leave settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (settings.id) {
        // Update existing record
        const { error } = await supabase
          .from('leave_settings')
          .update({
            default_leave_days: settings.default_leave_days,
            carry_over_enabled: settings.carry_over_enabled,
            manager_approval_required: settings.manager_approval_required,
            max_carry_over_days: settings.max_carry_over_days,
          })
          .eq('id', settings.id);

        if (error) {
          console.error('Error updating leave settings:', error);
          toast({
            title: "Error",
            description: "Failed to update leave settings",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Check if any record exists first
        const { data: existingData, error: fetchError } = await supabase
          .from('leave_settings')
          .select('*')
          .maybeSingle();

        if (fetchError) {
          console.error('Error checking existing leave settings:', fetchError);
          toast({
            title: "Error",
            description: "Failed to check existing leave settings",
            variant: "destructive",
          });
          return;
        }

        if (existingData) {
          // Update the existing record
          const { error } = await supabase
            .from('leave_settings')
            .update({
              default_leave_days: settings.default_leave_days,
              carry_over_enabled: settings.carry_over_enabled,
              manager_approval_required: settings.manager_approval_required,
              max_carry_over_days: settings.max_carry_over_days,
            })
            .eq('id', existingData.id);

          if (error) {
            console.error('Error updating existing leave settings:', error);
            toast({
              title: "Error",
              description: "Failed to update leave settings",
              variant: "destructive",
            });
            return;
          }

          setSettings(prev => ({ ...prev, id: existingData.id }));
        } else {
          // Create new record only if none exists
          const { data, error } = await supabase
            .from('leave_settings')
            .insert([{
              default_leave_days: settings.default_leave_days,
              carry_over_enabled: settings.carry_over_enabled,
              manager_approval_required: settings.manager_approval_required,
              max_carry_over_days: settings.max_carry_over_days,
            }])
            .select()
            .single();

          if (error) {
            console.error('Error creating leave settings:', error);
            toast({
              title: "Error",
              description: "Failed to create leave settings",
              variant: "destructive",
            });
            return;
          }

          setSettings(prev => ({ ...prev, id: data.id }));
        }
      }

      toast({
        title: "Success",
        description: "Leave settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving leave settings:', error);
      toast({
        title: "Error",
        description: "Failed to save leave settings",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading leave settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="card-premium animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-primary" />
            Leave Management Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="default-leave-days">Default Annual Leave Days</Label>
              <Input
                id="default-leave-days"
                type="number"
                value={settings.default_leave_days}
                onChange={(e) => setSettings(prev => ({ ...prev, default_leave_days: parseInt(e.target.value) }))}
                placeholder="28"
              />
              <p className="text-sm text-muted-foreground">
                Default number of leave days for new employees
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-carry-over">Maximum Carry Over Days</Label>
              <Input
                id="max-carry-over"
                type="number"
                value={settings.max_carry_over_days}
                onChange={(e) => setSettings(prev => ({ ...prev, max_carry_over_days: parseInt(e.target.value) }))}
                placeholder="5"
              />
              <p className="text-sm text-muted-foreground">
                Maximum days that can be carried over to next year
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Carry Over Leave Days</Label>
                <p className="text-sm text-muted-foreground">
                  Allow unused leave to carry over to next year
                </p>
              </div>
              <Switch 
                checked={settings.carry_over_enabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, carry_over_enabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Manager Approval Required</Label>
                <p className="text-sm text-muted-foreground">
                  Require manager approval for all leave requests
                </p>
              </div>
              <Switch 
                checked={settings.manager_approval_required}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, manager_approval_required: checked }))}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="bg-gradient-primary hover:opacity-90">
              <Save className="w-4 h-4 mr-2" />
              Save Leave Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <LeaveTypeManagement />
    </div>
  );
}
