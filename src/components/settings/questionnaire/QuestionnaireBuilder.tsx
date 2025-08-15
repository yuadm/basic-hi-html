
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, ChevronUp, ChevronDown, HelpCircle, CheckSquare, Type, Hash, List } from "lucide-react";
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

interface ComplianceType {
  id: string;
  name: string;
  description?: string;
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
}

interface QuestionnaireBuilderProps {
  questionnaire: Questionnaire | null;
  complianceTypes: ComplianceType[];
  branches: Branch[];
  onSave: () => void;
  onCancel: () => void;
}

export function QuestionnaireBuilder({
  questionnaire,
  complianceTypes,
  branches,
  onSave,
  onCancel
}: QuestionnaireBuilderProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    compliance_type_id: '',
    branch_id: '',
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState<{
    question_text: string;
    question_type: 'yes_no' | 'text' | 'multiple_choice' | 'number';
    is_required: boolean;
    options: string[];
    section: string;
    help_text: string;
  }>({
    question_text: "",
    question_type: "yes_no",
    is_required: true,
    options: [],
    section: "",
    help_text: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (questionnaire) {
      setFormData({
        name: questionnaire.name,
        description: questionnaire.description || '',
        compliance_type_id: questionnaire.compliance_type_id || '',
        branch_id: questionnaire.branch_id || 'global',
      });
      
      if (questionnaire.id) {
        fetchQuestions(questionnaire.id);
      }
    }
  }, [questionnaire]);

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

      const formattedQuestions = data?.map((item, index) => ({
        id: item.compliance_questions.id,
        question_text: item.compliance_questions.question_text,
        question_type: item.compliance_questions.question_type as 'yes_no' | 'text' | 'multiple_choice' | 'number',
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

  const loadTemplate = (templateType: string) => {
    let templateQuestions: Omit<Question, 'id' | 'order_index'>[] = [];
    
    switch (templateType) {
      case 'spot_check':
        templateQuestions = [
          {
            question_text: "Care Worker arrives at the Service User's home on time",
            question_type: "yes_no",
            is_required: true,
            section: "Arrival & Preparation"
          },
          {
            question_text: "Care Worker has keys for entry/Alerts the Service User upon arrival / key safe number",
            question_type: "yes_no",
            is_required: true,
            section: "Arrival & Preparation"
          },
          {
            question_text: "Care Worker is wearing a valid and current ID badge",
            question_type: "yes_no",
            is_required: true,
            section: "Professional Standards"
          },
          {
            question_text: "Care Worker practices safe hygiene (use of PPE clothing, gloves/aprons etc.)",
            question_type: "yes_no",
            is_required: true,
            section: "Health & Safety"
          },
          {
            question_text: "Care Worker checks Service User's care plan upon arrival",
            question_type: "yes_no",
            is_required: true,
            section: "Care Delivery"
          }
        ];
        break;
      
      case 'supervision':
        templateQuestions = [
          {
            question_text: "Employee demonstrates understanding of their role and responsibilities",
            question_type: "multiple_choice",
            is_required: true,
            options: ["Excellent", "Good", "Satisfactory", "Needs Improvement"],
            section: "Performance Review"
          },
          {
            question_text: "Quality of work delivered consistently meets standards",
            question_type: "multiple_choice",
            is_required: true,
            options: ["Excellent", "Good", "Satisfactory", "Needs Improvement"],
            section: "Performance Review"
          }
        ];
        break;
        
      case 'annual_appraisal':
        templateQuestions = [
          {
            question_text: "Overall job performance rating",
            question_type: "multiple_choice",
            is_required: true,
            options: ["Outstanding", "Exceeds Expectations", "Meets Expectations", "Below Expectations", "Unsatisfactory"],
            section: "Performance Summary"
          },
          {
            question_text: "Key achievements this year",
            question_type: "text",
            is_required: false,
            section: "Performance Summary"
          }
        ];
        break;
    }

    const formattedQuestions = templateQuestions.map((q, index) => ({
      ...q,
      id: `template_${Date.now()}_${index}`,
      order_index: index
    }));

    setQuestions(formattedQuestions);
    
    toast({
      title: "Template Loaded",
      description: `${templateType.replace('_', ' ')} template has been loaded`,
    });
  };

  const addQuestion = () => {
    if (!newQuestion.question_text.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question text",
        variant: "destructive",
      });
      return;
    }

    const question: Question = {
      id: `new_${Date.now()}`,
      question_text: newQuestion.question_text,
      question_type: newQuestion.question_type,
      is_required: newQuestion.is_required,
      options: newQuestion.question_type === 'multiple_choice' ? newQuestion.options.filter(opt => opt.trim()) : undefined,
      section: newQuestion.section || 'General',
      help_text: newQuestion.help_text || undefined,
      order_index: questions.length
    };

    setQuestions([...questions, question]);
    setNewQuestion({
      question_text: "",
      question_type: "yes_no",
      is_required: true,
      options: [],
      section: "",
      help_text: ""
    });
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const addOption = () => {
    setNewQuestion({
      ...newQuestion,
      options: [...newQuestion.options, ""]
    });
  };

  const updateOption = (index: number, value: string) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions[index] = value;
    setNewQuestion({
      ...newQuestion,
      options: updatedOptions
    });
  };

  const removeOption = (index: number) => {
    setNewQuestion({
      ...newQuestion,
      options: newQuestion.options.filter((_, i) => i !== index)
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.compliance_type_id || questions.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and add at least one question",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let questionnaireId = questionnaire?.id;

      if (!questionnaireId) {
        // Create new questionnaire
        const { data: newQuestionnaire, error: questionnaireError } = await supabase
          .from('compliance_questionnaires')
          .insert({
            name: formData.name,
            description: formData.description || null,
            compliance_type_id: formData.compliance_type_id,
            branch_id: formData.branch_id === 'global' ? null : formData.branch_id,
            is_active: true
          })
          .select()
          .single();

        if (questionnaireError) throw questionnaireError;
        questionnaireId = newQuestionnaire.id;
      } else {
        // Update existing questionnaire
        const { error: updateError } = await supabase
          .from('compliance_questionnaires')
          .update({
            name: formData.name,
            description: formData.description || null
          })
          .eq('id', questionnaireId);

        if (updateError) throw updateError;

        // Delete existing question links
        await supabase
          .from('compliance_questionnaire_questions')
          .delete()
          .eq('questionnaire_id', questionnaireId);
      }

      // Create questions
      const { data: createdQuestions, error: questionsError } = await supabase
        .from('compliance_questions')
        .insert(
          questions.map((q, index) => ({
            question_text: q.question_text,
            question_type: q.question_type,
            is_required: q.is_required,
            options: q.options || null,
            order_index: index
          }))
        )
        .select();

      if (questionsError) throw questionsError;

      // Link questions to questionnaire
      const { error: linkError } = await supabase
        .from('compliance_questionnaire_questions')
        .insert(
          createdQuestions.map((question, index) => ({
            questionnaire_id: questionnaireId,
            question_id: question.id,
            order_index: index
          }))
        );

      if (linkError) throw linkError;

      toast({
        title: "Success",
        description: "Questionnaire saved successfully!",
      });

      onSave();
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      toast({
        title: "Error",
        description: "Failed to save questionnaire. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Compliance Type <span className="text-red-500">*</span></Label>
          <Select 
            value={formData.compliance_type_id} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, compliance_type_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select compliance type" />
            </SelectTrigger>
            <SelectContent>
              {complianceTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Branch (Optional)</Label>
          <Select 
            value={formData.branch_id} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, branch_id: value === 'global' ? '' : value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Global (all branches)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global (all branches)</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Questionnaire Name <span className="text-red-500">*</span></Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Care Worker Spot Check"
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description..."
          />
        </div>
      </div>

      {/* Template Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          onClick={() => loadTemplate('spot_check')}
        >
          Load Spot Check Template
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => loadTemplate('supervision')}
        >
          Load Supervision Template
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => loadTemplate('annual_appraisal')}
        >
          Load Annual Appraisal Template
        </Button>
      </div>

      {/* Add New Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Section (Optional)</Label>
              <Input
                value={newQuestion.section}
                onChange={(e) => setNewQuestion({ ...newQuestion, section: e.target.value })}
                placeholder="e.g., Health & Safety"
              />
            </div>
            <div className="space-y-2">
              <Label>Question Type</Label>
              <Select
                value={newQuestion.question_type}
                onValueChange={(value: any) => setNewQuestion({ ...newQuestion, question_type: value, options: [] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes_no">Yes/No</SelectItem>
                  <SelectItem value="text">Text Input</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Question Text</Label>
            <Textarea
              value={newQuestion.question_text}
              onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
              placeholder="Enter your question..."
            />
          </div>

          <div className="space-y-2">
            <Label>Help Text (Optional)</Label>
            <Input
              value={newQuestion.help_text}
              onChange={(e) => setNewQuestion({ ...newQuestion, help_text: e.target.value })}
              placeholder="Additional guidance for the question"
            />
          </div>

          {newQuestion.question_type === 'multiple_choice' && (
            <div className="space-y-2">
              <Label>Options</Label>
              {newQuestion.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
              >
                Add Option
              </Button>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="required"
              checked={newQuestion.is_required}
              onChange={(e) => setNewQuestion({ ...newQuestion, is_required: e.target.checked })}
            />
            <Label htmlFor="required">Required</Label>
          </div>

          <Button onClick={addQuestion} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </CardContent>
      </Card>

      {/* Questions List */}
      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Questions ({questions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {questions.map((question, index) => (
              <div key={question.id} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">Q{index + 1}</span>
                    {question.section && (
                      <Badge variant="outline" className="text-xs">
                        {question.section}
                      </Badge>
                    )}
                    <Badge variant={question.question_type === 'yes_no' ? 'default' : 'secondary'}>
                      {question.question_type.replace('_', ' ')}
                    </Badge>
                    {question.is_required && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <p className="text-sm">{question.question_text}</p>
                  {question.help_text && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Help: {question.help_text}
                    </p>
                  )}
                  {question.options && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">Options: {question.options.join(', ')}</p>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeQuestion(question.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Questionnaire"}
        </Button>
      </div>
    </div>
  );
}
