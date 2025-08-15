
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  is_active: boolean;
  compliance_type_id?: string;
  branch_id?: string;
  version: number;
  effective_from?: string;
  effective_to?: string;
}

interface QuestionnairePreviewProps {
  questionnaire: Questionnaire;
  onClose: () => void;
}

export function QuestionnairePreview({ questionnaire, onClose }: QuestionnairePreviewProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuestions();
  }, [questionnaire]);

  const fetchQuestions = async () => {
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
            options,
            section,
            help_text
          )
        `)
        .eq('questionnaire_id', questionnaire.id)
        .order('order_index');

      if (error) throw error;

      const formattedQuestions = data?.map((item) => ({
        id: item.compliance_questions.id,
        question_text: item.compliance_questions.question_text,
        question_type: item.compliance_questions.question_type,
        is_required: item.compliance_questions.is_required,
        options: item.compliance_questions.options || undefined,
        section: item.compliance_questions.section || '',
        help_text: item.compliance_questions.help_text || '',
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
    } finally {
      setLoading(false);
    }
  };

  const groupedQuestions = questions.reduce((acc, question) => {
    const section = question.section || 'General';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(question);
    return acc;
  }, {} as Record<string, Question[]>);

  const renderQuestionInput = (question: Question) => {
    switch (question.question_type) {
      case 'yes_no':
        return (
          <Select disabled>
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
          <Select disabled>
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
            placeholder="Enter number..." 
            disabled 
            className="w-32"
          />
        );
      
      case 'text':
      default:
        return (
          <Textarea 
            placeholder="Enter response..." 
            disabled 
            rows={2}
          />
        );
    }
  };

  if (loading) {
    return <div>Loading questionnaire preview...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">{questionnaire.name}</h3>
          <Badge variant="outline">v{questionnaire.version}</Badge>
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

      {questions.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No questions found in this questionnaire.
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Close Preview
        </Button>
      </div>
    </div>
  );
}
