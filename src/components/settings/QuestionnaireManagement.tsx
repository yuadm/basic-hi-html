import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Question {
  id: string;
  question_text: string;
  question_type: 'yes_no' | 'text' | 'multiple_choice' | 'number';
  is_required: boolean;
  options?: string[];
}

interface ComplianceType {
  id: string;
  name: string;
  description?: string;
}

export function QuestionnaireManagement() {
  const [complianceTypes, setComplianceTypes] = useState<ComplianceType[]>([]);
  const [selectedComplianceType, setSelectedComplianceType] = useState("");
  const [questionnaireName, setQuestionnaireName] = useState("");
  const [questionnaireDescription, setQuestionnaireDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [newQuestion, setNewQuestion] = useState<{
    question_text: string;
    question_type: 'yes_no' | 'text' | 'multiple_choice' | 'number';
    is_required: boolean;
    options: string[];
  }>({
    question_text: "",
    question_type: "yes_no",
    is_required: true,
    options: []
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchComplianceTypes();
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
      id: Date.now().toString(),
      question_text: newQuestion.question_text,
      question_type: newQuestion.question_type,
      is_required: newQuestion.is_required,
      options: newQuestion.question_type === 'multiple_choice' ? newQuestion.options : undefined
    };

    setQuestions([...questions, question]);
    setNewQuestion({
      question_text: "",
      question_type: "yes_no",
      is_required: true,
      options: []
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

  const saveQuestionnaire = async () => {
    if (!questionnaireName || !selectedComplianceType || questions.length === 0) {
      toast({
        title: "Error", 
        description: "Please fill in all required fields and add at least one question",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create the questionnaire
      const { data: questionnaire, error: questionnaireError } = await supabase
        .from('compliance_questionnaires')
        .insert({
          name: questionnaireName,
          description: questionnaireDescription,
          compliance_type_id: selectedComplianceType,
          is_active: true
        })
        .select()
        .single();

      if (questionnaireError) throw questionnaireError;

      // Create the questions
      const questionsToInsert = questions.map((q, index) => ({
        question_text: q.question_text,
        question_type: q.question_type,
        is_required: q.is_required,
        options: q.options || null,
        order_index: index
      }));

      const { data: createdQuestions, error: questionsError } = await supabase
        .from('compliance_questions')
        .insert(questionsToInsert)
        .select();

      if (questionsError) throw questionsError;

      // Link questions to questionnaire
      const questionnaireQuestions = createdQuestions.map((question, index) => ({
        questionnaire_id: questionnaire.id,
        question_id: question.id,
        order_index: index
      }));

      const { error: linkError } = await supabase
        .from('compliance_questionnaire_questions')
        .insert(questionnaireQuestions);

      if (linkError) throw linkError;

      // Update compliance type to link to this questionnaire
      const { error: updateError } = await supabase
        .from('compliance_types')
        .update({ questionnaire_id: questionnaire.id })
        .eq('id', selectedComplianceType);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Questionnaire saved successfully!",
      });

      // Reset form
      setQuestionnaireName("");
      setQuestionnaireDescription("");
      setSelectedComplianceType("");
      setQuestions([]);
      
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Questionnaire Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Compliance Type</Label>
              <Select value={selectedComplianceType} onValueChange={setSelectedComplianceType}>
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
              <Label>Questionnaire Name</Label>
              <Input
                value={questionnaireName}
                onChange={(e) => setQuestionnaireName(e.target.value)}
                placeholder="e.g., Islington Care Worker Spot Check"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={questionnaireDescription}
              onChange={(e) => setQuestionnaireDescription(e.target.value)}
              placeholder="Brief description of this questionnaire..."
            />
          </div>

          {/* Add New Question */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add New Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Question Text</Label>
                <Textarea
                  value={newQuestion.question_text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                  placeholder="Enter your question..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select
                    value={newQuestion.question_type}
                    onValueChange={(value: any) => setNewQuestion({ ...newQuestion, question_type: value })}
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
                
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="required"
                    checked={newQuestion.is_required}
                    onChange={(e) => setNewQuestion({ ...newQuestion, is_required: e.target.checked })}
                  />
                  <Label htmlFor="required">Required</Label>
                </div>
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
                        <Badge variant={question.question_type === 'yes_no' ? 'default' : 'secondary'}>
                          {question.question_type.replace('_', ' ')}
                        </Badge>
                        {question.is_required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <p className="text-sm">{question.question_text}</p>
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
                      Remove
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Save Questionnaire */}
          <div className="flex justify-end">
            <Button 
              onClick={saveQuestionnaire}
              disabled={!questionnaireName || !selectedComplianceType || questions.length === 0 || loading}
            >
              <Settings className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Questionnaire"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}