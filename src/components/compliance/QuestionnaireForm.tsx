
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

interface Questionnaire {
  id: string;
  name: string;
  description?: string;
  version?: number;
}

interface QuestionnaireFormProps {
  complianceTypeId: string;
  branchId?: string;
  employeeId: string;
  periodIdentifier: string;
  onSubmit: (responses: Record<string, any>) => void;
  onCancel: () => void;
  initialData?: Record<string, any>;
}

export function QuestionnaireForm({
  complianceTypeId,
  branchId,
  employeeId,
  periodIdentifier,
  onSubmit,
  onCancel,
  initialData = {}
}: QuestionnaireFormProps) {
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>(initialData);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveQuestionnaire();
  }, [complianceTypeId, branchId]);

  const fetchActiveQuestionnaire = async () => {
    try {
      // First try to find branch-specific questionnaire, then fall back to global
      let { data: questionnaire, error } = await supabase
        .from('compliance_questionnaires')
        .select('id, name, description')
        .eq('compliance_type_id', complianceTypeId)
        .eq('branch_id', branchId || null)
        .eq('is_active', true)
        .single();

      // If no branch-specific questionnaire found and we have a branch, try global
      if (error && branchId) {
        const { data: globalQuestionnaire, error: globalError } = await supabase
          .from('compliance_questionnaires')
          .select('id, name, description')
          .eq('compliance_type_id', complianceTypeId)
          .is('branch_id', null)
          .eq('is_active', true)
          .single();

        if (globalError) throw globalError;
        questionnaire = globalQuestionnaire;
      } else if (error) {
        throw error;
      }

      if (questionnaire) {
        setQuestionnaire(questionnaire);
        await fetchQuestions(questionnaire.id);
      }
    } catch (error) {
      console.error('Error fetching questionnaire:', error);
      toast({
        title: "Error",
        description: "No active questionnaire found for this compliance type",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (questionnaireId: string) => {
    try {
      const { data, error } = await supabase
        .from('compliance_questionnaire_questions')
        .select(`
          order_index,
          compliance_questions (
            id,
            question_text,
            question_type,
            is_required,
            options
          )
        `)
        .eq('questionnaire_id', questionnaireId)
        .order('order_index');

      if (error) throw error;

      const formattedQuestions = data?.map((item) => ({
        id: item.compliance_questions.id,
        question_text: item.compliance_questions.question_text,
        question_type: item.compliance_questions.question_type,
        is_required: item.compliance_questions.is_required,
        options: item.compliance_questions.options as string[] || undefined,
        section: 'General', // Default section since column doesn't exist yet
        help_text: '', // Default help text since column doesn't exist yet
        order_index: item.order_index
      })) || [];

      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive",
      });
    }
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const validateForm = () => {
    const requiredQuestions = questions.filter(q => q.is_required);
    const missingResponses = requiredQuestions.filter(q => 
      !responses[q.id] || (typeof responses[q.id] === 'string' && !responses[q.id].trim())
    );

    if (missingResponses.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please answer all required questions (${missingResponses.length} missing)`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const formData = {
        questionnaire_id: questionnaire?.id,
        questionnaire_version: questionnaire?.version || 1,
        responses,
        completed_at: new Date().toISOString()
      };

      onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to submit questionnaire",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = (question: Question) => {
    const value = responses[question.id] || '';

    switch (question.question_type) {
      case 'yes_no':
        return (
          <Select 
            value={value} 
            onValueChange={(newValue) => handleResponseChange(question.id, newValue)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        );
      
      case 'multiple_choice':
        return (
          <Select 
            value={value} 
            onValueChange={(newValue) => handleResponseChange(question.id, newValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'number':
        return (
          <Input 
            type="number" 
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Enter number..." 
            className="w-32"
          />
        );
      
      case 'text':
      default:
        return (
          <Textarea 
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Enter response..." 
            rows={2}
          />
        );
    }
  };

  if (loading) {
    return <div>Loading questionnaire...</div>;
  }

  if (!questionnaire || questions.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No questionnaire is currently available for this compliance type. Please contact your administrator.
        </AlertDescription>
      </Alert>
    );
  }

  // Group questions by section
  const groupedQuestions = questions.reduce((acc, question) => {
    const section = question.section || 'General';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(question);
    return acc;
  }, {} as Record<string, Question[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">{questionnaire.name}</h3>
          <Badge variant="outline">v{questionnaire.version || 1}</Badge>
        </div>
        {questionnaire.description && (
          <p className="text-muted-foreground">{questionnaire.description}</p>
        )}
      </div>

      {/* Questions by Section */}
      <div className="space-y-6">
        {Object.entries(groupedQuestions).map(([section, sectionQuestions]) => (
          <Card key={section}>
            <CardHeader>
              <CardTitle className="text-base">{section}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sectionQuestions.map((question, index) => (
                <div key={question.id} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium mt-1">
                      {questions.indexOf(question) + 1}.
                    </span>
                    <div className="flex-1 space-y-2">
                      <div>
                        <Label className="text-sm font-medium">
                          {question.question_text}
                          {question.is_required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </Label>
                        {question.help_text && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {question.help_text}
                          </p>
                        )}
                      </div>
                      {renderQuestionInput(question)}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Questionnaire"}
        </Button>
      </div>
    </div>
  );
}
