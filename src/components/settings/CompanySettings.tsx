
import { useState, useEffect, useRef } from "react";
import { Building2, Save, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function CompanySettings() {
  const { companySettings, updateCompanySettings, loading } = useCompany();
  const [formData, setFormData] = useState(companySettings);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setFormData(companySettings);
  }, [companySettings]);

  const handleSave = async () => {
    await updateCompanySettings(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid image file (JPEG, PNG, WebP, or SVG)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setLogoUploading(true);

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName);

      // Update form data
      setFormData(prev => ({ ...prev, logo: publicUrl }));

      // Update favicon
      updateFavicon(publicUrl);

      toast({
        title: "Logo uploaded successfully",
        description: "Your company logo has been updated",
      });

    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLogoUploading(false);
    }
  };

  const updateFavicon = (logoUrl: string) => {
    // Remove existing favicon links
    const existingLinks = document.querySelectorAll('link[rel*="icon"]');
    existingLinks.forEach(link => link.remove());

    // Add new favicon
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = logoUrl;
    document.head.appendChild(link);
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logo: undefined }));
    
    // Reset favicon to default
    const existingLinks = document.querySelectorAll('link[rel*="icon"]');
    existingLinks.forEach(link => link.remove());
    
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/x-icon';
    link.href = '/favicon.ico';
    document.head.appendChild(link);
  };

  if (loading) {
    return <div>Loading company settings...</div>;
  }

  return (
    <Card className="card-premium animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-primary" />
          Company Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload Section */}
        <div className="space-y-4">
          <Label>Company Logo</Label>
          <div className="flex items-center gap-4">
            {formData.logo ? (
              <div className="relative">
                <img
                  src={formData.logo}
                  alt="Company Logo"
                  className="w-16 h-16 object-contain rounded-lg border border-border bg-card p-2"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                  onClick={removeLogo}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex-1">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={logoUploading}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {logoUploading ? "Uploading..." : "Upload Logo"}
              </Button>
              <p className="text-sm text-muted-foreground mt-1">
                Upload a logo that will appear in the sidebar and as favicon. Supports JPEG, PNG, WebP, SVG (max 5MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter company name"
            />
            <p className="text-sm text-muted-foreground">
              This will appear in the sidebar and throughout the application
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-tagline">Tagline</Label>
            <Input
              id="company-tagline"
              value={formData.tagline}
              onChange={(e) => handleInputChange('tagline', e.target.value)}
              placeholder="Enter company tagline"
            />
            <p className="text-sm text-muted-foreground">
              Short description shown below the company name
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company-address">Company Address</Label>
          <Textarea
            id="company-address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Enter full company address"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="company-phone">Phone Number</Label>
            <Input
              id="company-phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-email">Email Address</Label>
            <Input
              id="company-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-gradient-primary hover:opacity-90">
            <Save className="w-4 h-4 mr-2" />
            Save Company Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
