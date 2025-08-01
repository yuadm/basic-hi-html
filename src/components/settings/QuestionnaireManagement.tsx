import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  question_text: string;
  question_type: 'yes_no' | 'text' | 'multiple_choice' | 'number';
  is_required: boolean;
  options?: string[];
}

export function QuestionnaireManagement() {
  const [selectedComplianceType, setSelectedComplianceType] = useState("");
  const [questionnaireName, setQuestionnaireName] = useState("");
  const [questionnaireDescription, setQuestionnaireDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
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
                  <SelectItem value="care-worker-spot-check">Care Worker Spot Check</SelectItem>
                  <SelectItem value="health-safety">Health & Safety</SelectItem>
                  <SelectItem value="training">Training Compliance</SelectItem>
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
              onClick={() => {
                toast({
                  title: "Note",
                  description: "Questionnaire builder is ready for implementation. Database schema has been created.",
                });
              }}
              disabled={!questionnaireName || !selectedComplianceType || questions.length === 0}
            >
              <Settings className="h-4 w-4 mr-2" />
              Save Questionnaire
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}