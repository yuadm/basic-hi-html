
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Questionnaire {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  compliance_type_id?: string;
  branch_id?: string;
  version: number;
  effective_from?: string;
  effective_to?: string;
  created_at: string;
}

interface QuestionnaireVersionsProps {
  questionnaire: Questionnaire;
  onClose: () => void;
  onEditVersion: (version: Questionnaire) => void;
}

export function QuestionnaireVersions({ questionnaire, onClose, onEditVersion }: QuestionnaireVersionsProps) {
  const [versions, setVersions] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchVersions();
  }, [questionnaire]);

  const fetchVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_questionnaires')
        .select('*')
        .eq('compliance_type_id', questionnaire.compliance_type_id)
        .eq('branch_id', questionnaire.branch_id || null)
        .is('deleted_at', null)
        .order('version', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast({
        title: "Error",
        description: "Failed to load versions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (version: Questionnaire) => {
    if (!version.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const effectiveFrom = version.effective_from;
    const effectiveTo = version.effective_to;
    
    if (effectiveFrom && effectiveFrom > today) {
      return <Badge variant="outline">Scheduled</Badge>;
    }
    
    if (effectiveTo && effectiveTo <= today) {
      return <Badge variant="secondary">Expired</Badge>;
    }
    
    return <Badge variant="default">Active</Badge>;
  };

  if (loading) {
    return <div>Loading versions...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {versions.map((version) => (
          <Card key={version.id} className="border border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">Version {version.version}</h4>
                    {getStatusBadge(version)}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Created: {new Date(version.created_at).toLocaleDateString()}</p>
                    {version.effective_from && (
                      <p>Effective from: {version.effective_from}</p>
                    )}
                    {version.effective_to && (
                      <p>Effective to: {version.effective_to}</p>
                    )}
                  </div>
                  {version.description && (
                    <p className="text-sm text-muted-foreground">
                      {version.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditVersion(version)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {versions.length === 0 && (
        <p className="text-muted-foreground text-center py-6">
          No versions found.
        </p>
      )}
      
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
