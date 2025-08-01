
import { useState, useEffect } from "react";
import { Shield, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ComplianceTypeManagement } from "./ComplianceTypeManagement";

interface ComplianceSettingsData {
  id?: string;
  auto_generate_periods: boolean;
  reminder_days_before: number;
  email_notifications: boolean;
  archive_completed_records: boolean;
}

export function ComplianceSettings() {
  const [settings, setSettings] = useState<ComplianceSettingsData>({
    auto_generate_periods: true,
    reminder_days_before: 7,
    email_notifications: true,
    archive_completed_records: false,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_settings')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching compliance settings:', error);
        return;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching compliance settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (settings.id) {
        // Update existing record
        const { error } = await supabase
          .from('compliance_settings')
          .update(settings)
          .eq('id', settings.id);

        if (error) {
          console.error('Error updating compliance settings:', error);
          toast({
            title: "Error",
            description: "Failed to update compliance settings",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('compliance_settings')
          .insert([settings])
          .select()
          .single();

        if (error) {
          console.error('Error creating compliance settings:', error);
          toast({
            title: "Error",
            description: "Failed to create compliance settings",
            variant: "destructive",
          });
          return;
        }

        setSettings(data);
      }

      toast({
        title: "Success",
        description: "Compliance settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving compliance settings:', error);
      toast({
        title: "Error",
        description: "Failed to save compliance settings",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading compliance settings...</div>;
  }

  return (
    <Card className="card-premium animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          Compliance Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="reminder-days">Reminder Days Before Due</Label>
            <Input
              id="reminder-days"
              type="number"
              value={settings.reminder_days_before}
              onChange={(e) => setSettings(prev => ({ ...prev, reminder_days_before: parseInt(e.target.value) }))}
              placeholder="7"
            />
            <p className="text-sm text-muted-foreground">
              Send reminders this many days before compliance is due
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-generate Periods</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically create compliance periods
                </p>
              </div>
              <Switch 
                checked={settings.auto_generate_periods}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_generate_periods: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send email reminders for compliance tasks
                </p>
              </div>
              <Switch 
                checked={settings.email_notifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, email_notifications: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Archive Completed Records</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically archive completed compliance records
                </p>
              </div>
              <Switch 
                checked={settings.archive_completed_records}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, archive_completed_records: checked }))}
              />
            </div>
          </div>
        </div>

        <ComplianceTypeManagement />

        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-gradient-primary hover:opacity-90">
            <Save className="w-4 h-4 mr-2" />
            Save Compliance Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
