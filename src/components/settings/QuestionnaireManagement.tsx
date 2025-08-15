import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Edit, Trash2, History, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuestionnaireBuilder } from "./questionnaire/QuestionnaireBuilder";
import { QuestionnaireVersions } from "./questionnaire/QuestionnaireVersions";
import { QuestionnairePreview } from "./questionnaire/QuestionnairePreview";

interface ComplianceType {
  id: string;
  name: string;
  description?: string;
  has_questionnaire?: boolean;
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
  version?: number;
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
        .select('id, name, description')
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map the data to include version and other properties with defaults
      const mappedData = data?.map(item => ({
        ...item,
        version: 1, // Default version since column doesn't exist yet
        effective_from: undefined,
        effective_to: undefined
      })) || [];
      
      setQuestionnaires(mappedData);
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
      const nextVersion = (baseQuestionnaire.version || 1) + 1;

      // Create new version
      const newQuestionnaire = {
        name: baseQuestionnaire.name,
        description: baseQuestionnaire.description,
        compliance_type_id: baseQuestionnaire.compliance_type_id,
        branch_id: baseQuestionnaire.branch_id,
        version: nextVersion,
        is_active: true
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
        .delete()
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
    
    return <Badge variant="default">Active</Badge>;
  };

  const openBuilderForType = (complianceTypeId: string, complianceTypeName: string) => {
    const existingQuestionnaire = questionnaires.find(q => q.compliance_type_id === complianceTypeId);
    
    if (existingQuestionnaire) {
      setSelectedQuestionnaire(existingQuestionnaire);
    } else {
      // Create new questionnaire for this compliance type
      setSelectedQuestionnaire({
        id: '',
        name: `${complianceTypeName} Questionnaire`,
        description: `Default questionnaire for ${complianceTypeName}`,
        is_active: true,
        compliance_type_id: complianceTypeId,
        branch_id: '',
        created_at: new Date().toISOString()
      });
    }
    setShowBuilder(true);
  };

  const createFromTemplate = (complianceTypeId: string, templateType: string) => {
    const complianceType = complianceTypes.find(ct => ct.id === complianceTypeId);
    if (!complianceType) return;

    setSelectedQuestionnaire({
      id: '',
      name: `${complianceType.name} Template`,
      description: `Template questionnaire for ${complianceType.name}`,
      is_active: true,
      compliance_type_id: complianceTypeId,
      branch_id: '',
      created_at: new Date().toISOString()
    });
    setShowBuilder(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Questionnaire Management</h2>
        <p className="text-muted-foreground">Manage compliance questionnaires by type</p>
      </div>

      {/* Compliance Type Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {complianceTypes.map((type) => {
          const typeQuestionnaires = questionnaires.filter(q => q.compliance_type_id === type.id);
          const hasQuestionnaire = typeQuestionnaires.length > 0;
          const activeQuestionnaire = typeQuestionnaires.find(q => q.is_active);
          
          return (
            <Card key={type.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 group">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Document Icon */}
                  <div className={`w-16 h-20 rounded-lg flex items-center justify-center ${
                    hasQuestionnaire 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <FileText className="w-8 h-8" />
                  </div>
                  
                  {/* Type Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{type.name}</h3>
                    {type.description && (
                      <p className="text-sm text-muted-foreground">
                        {type.description}
                      </p>
                    )}
                    
                    {/* Status */}
                    <div className="flex justify-center">
                      {hasQuestionnaire ? (
                        <Badge variant="default" className="text-xs">
                          {typeQuestionnaires.length} questionnaire{typeQuestionnaires.length !== 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          No questionnaires
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {hasQuestionnaire ? (
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            openBuilderForType(type.id, type.name);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Questionnaire
                        </Button>
                        {activeQuestionnaire && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedQuestionnaire(activeQuestionnaire);
                              setShowPreview(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            openBuilderForType(type.id, type.name);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Questionnaire
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            createFromTemplate(type.id, type.name.toLowerCase().replace(/\s+/g, '_'));
                          }}
                        >
                          Use Template
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* All Questionnaires List (Collapsible) */}
      {questionnaires.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              All Questionnaires ({questionnaires.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {questionnaires.map((questionnaire) => (
                <div key={questionnaire.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-sm">{questionnaire.name}</h4>
                      <Badge variant="outline" className="text-xs">v{questionnaire.version || 1}</Badge>
                      {getStatusBadge(questionnaire)}
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      {questionnaire.compliance_types && (
                        <span>{questionnaire.compliance_types.name}</span>
                      )}
                      {questionnaire.branches && (
                        <span>• {questionnaire.branches.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
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
                        setShowBuilder(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questionnaire Builder Dialog */}
      <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedQuestionnaire?.id ? `Edit Questionnaire v${selectedQuestionnaire.version || 1}` : 'Create New Questionnaire'}
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
