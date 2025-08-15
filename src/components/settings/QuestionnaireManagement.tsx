import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, FileText, Edit, Trash2, History, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QuestionnaireBuilder } from "./questionnaire/QuestionnaireBuilder";
import { QuestionnaireVersions } from "./questionnaire/QuestionnaireVersions";
import { QuestionnairePreview } from "./questionnaire/QuestionnairePreview";

interface Question {
  id: string;
  question_text: string;
  question_type: 'yes_no' | 'text' | 'multiple_choice' | 'number';
  is_required: boolean;
  options?: string[];
  section?: string;
  help_text?: string;
  order_index: number;
}

interface ComplianceType {
  id: string;
  name: string;
  description?: string;
  has_questionnaire: boolean;
}

interface Branch {
  id: string;
  name: string;
}

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
  compliance_types?: { name: string };
  branches?: { name: string };
  created_at: string;
}

export function QuestionnaireManagement() {
  const [complianceTypes, setComplianceTypes] = useState<ComplianceType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchComplianceTypes();
    fetchBranches();
    fetchQuestionnaires();
  }, []);

  const fetchComplianceTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_types')
        .select('id, name, description, has_questionnaire')
        .eq('has_questionnaire', true)
        .order('name');

      if (error) throw error;
      setComplianceTypes(data || []);
    } catch (error) {
      console.error('Error fetching compliance types:', error);
      toast({
        title: "Error",
        description: "Failed to load compliance types",
        variant: "destructive",
      });
    }
  };

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast({
        title: "Error",
        description: "Failed to load branches",
        variant: "destructive",
      });
    }
  };

  const fetchQuestionnaires = async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_questionnaires')
        .select(`
          *,
          compliance_types(name),
          branches(name)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestionnaires(data || []);
    } catch (error) {
      console.error('Error fetching questionnaires:', error);
      toast({
        title: "Error",
        description: "Failed to load questionnaires",
        variant: "destructive",
      });
    }
  };

  const createNewVersion = async (baseQuestionnaire: Questionnaire) => {
    try {
      // Get the highest version for this questionnaire type/branch combo
      const { data: existingVersions, error: versionError } = await supabase
        .from('compliance_questionnaires')
        .select('version')
        .eq('compliance_type_id', baseQuestionnaire.compliance_type_id)
        .eq('branch_id', baseQuestionnaire.branch_id || null)
        .is('deleted_at', null)
        .order('version', { ascending: false })
        .limit(1);

      if (versionError) throw versionError;

      const nextVersion = (existingVersions?.[0]?.version || 0) + 1;

      // Deactivate current active version
      await supabase
        .from('compliance_questionnaires')
        .update({ 
          is_active: false,
          effective_to: new Date().toISOString().split('T')[0]
        })
        .eq('compliance_type_id', baseQuestionnaire.compliance_type_id)
        .eq('branch_id', baseQuestionnaire.branch_id || null)
        .eq('is_active', true)
        .is('deleted_at', null);

      // Create new version
      const newQuestionnaire = {
        name: baseQuestionnaire.name,
        description: baseQuestionnaire.description,
        compliance_type_id: baseQuestionnaire.compliance_type_id,
        branch_id: baseQuestionnaire.branch_id,
        version: nextVersion,
        is_active: true,
        effective_from: new Date().toISOString().split('T')[0]
      };

      setSelectedQuestionnaire({
        ...baseQuestionnaire,
        ...newQuestionnaire,
        id: '',
        version: nextVersion
      });
      setShowBuilder(true);

      toast({
        title: "New Version Created",
        description: `Version ${nextVersion} is ready for editing`,
      });
    } catch (error) {
      console.error('Error creating new version:', error);
      toast({
        title: "Error",
        description: "Failed to create new version",
        variant: "destructive",
      });
    }
  };

  const deleteQuestionnaire = async (questionnaire: Questionnaire) => {
    try {
      const { error } = await supabase
        .from('compliance_questionnaires')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', questionnaire.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Questionnaire deleted successfully",
      });

      fetchQuestionnaires();
    } catch (error) {
      console.error('Error deleting questionnaire:', error);
      toast({
        title: "Error",
        description: "Failed to delete questionnaire",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (questionnaire: Questionnaire) => {
    if (!questionnaire.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const effectiveFrom = questionnaire.effective_from;
    const effectiveTo = questionnaire.effective_to;
    
    if (effectiveFrom && effectiveFrom > today) {
      return <Badge variant="outline">Scheduled</Badge>;
    }
    
    if (effectiveTo && effectiveTo <= today) {
      return <Badge variant="secondary">Expired</Badge>;
    }
    
    return <Badge variant="default">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Questionnaire Management</h2>
          <p className="text-muted-foreground">Manage compliance questionnaires with versioning and lifecycle control</p>
        </div>
        <Button 
          onClick={() => {
            setSelectedQuestionnaire(null);
            setShowBuilder(true);
          }}
          className="bg-gradient-primary hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Questionnaire
        </Button>
      </div>

      {/* Existing Questionnaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Existing Questionnaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          {questionnaires.length > 0 ? (
            <div className="space-y-4">
              {questionnaires.map((questionnaire) => (
                <Card key={questionnaire.id} className="border border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{questionnaire.name}</h4>
                          <Badge variant="outline">v{questionnaire.version}</Badge>
                          {getStatusBadge(questionnaire)}
                        </div>
                        {questionnaire.description && (
                          <p className="text-sm text-muted-foreground">
                            {questionnaire.description}
                          </p>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          {questionnaire.compliance_types && (
                            <Badge variant="outline">
                              {questionnaire.compliance_types.name}
                            </Badge>
                          )}
                          {questionnaire.branches && (
                            <Badge variant="outline">
                              {questionnaire.branches.name}
                            </Badge>
                          )}
                          {questionnaire.effective_from && (
                            <Badge variant="secondary" className="text-xs">
                              From: {questionnaire.effective_from}
                            </Badge>
                          )}
                          {questionnaire.effective_to && (
                            <Badge variant="secondary" className="text-xs">
                              To: {questionnaire.effective_to}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedQuestionnaire(questionnaire);
                            setShowPreview(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedQuestionnaire(questionnaire);
                            setShowVersions(true);
                          }}
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedQuestionnaire(questionnaire);
                            setShowBuilder(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => createNewVersion(questionnaire)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          New Version
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteQuestionnaire(questionnaire)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">
              No questionnaires created yet. Create your first questionnaire to get started.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Questionnaire Builder Dialog */}
      <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedQuestionnaire?.id ? `Edit Questionnaire v${selectedQuestionnaire.version}` : 'Create New Questionnaire'}
            </DialogTitle>
          </DialogHeader>
          <QuestionnaireBuilder
            questionnaire={selectedQuestionnaire}
            complianceTypes={complianceTypes}
            branches={branches}
            onSave={() => {
              setShowBuilder(false);
              fetchQuestionnaires();
            }}
            onCancel={() => setShowBuilder(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Versions Dialog */}
      <Dialog open={showVersions} onOpenChange={setShowVersions}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          {selectedQuestionnaire && (
            <QuestionnaireVersions
              questionnaire={selectedQuestionnaire}
              onClose={() => setShowVersions(false)}
              onEditVersion={(version) => {
                setSelectedQuestionnaire(version);
                setShowVersions(false);
                setShowBuilder(true);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Questionnaire Preview</DialogTitle>
          </DialogHeader>
          {selectedQuestionnaire && (
            <QuestionnairePreview
              questionnaire={selectedQuestionnaire}
              onClose={() => setShowPreview(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
