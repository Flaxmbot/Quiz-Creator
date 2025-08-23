"use client";

import React, { useState } from "react";
import type { Question, Option } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash, Plus, Wand2 } from "lucide-react";
import { enhanceQuestionAction } from "@/app/actions/quiz";
import { AISuggestionDialog } from "./ai-suggestion-dialog";
import type { EnhanceQuizQuestionOutput } from "@/ai/flows/enhance-quiz-question";
import { useToast } from "@/hooks/use-toast";

interface QuestionCardProps {
  index: number;
  question: Question;
  updateQuestion: (index: number, question: Question) => void;
  removeQuestion: (index: number) => void;
}

export function QuestionCard({
  index,
  question,
  updateQuestion,
  removeQuestion,
}: QuestionCardProps) {
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] =
    useState<EnhanceQuizQuestionOutput | null>(null);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

  const handleQuestionChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    updateQuestion(index, { ...question, [e.target.name]: e.target.value });
  };

  const handleOptionChange = (
    optionIndex: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newOptions = [...question.options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], text: e.target.value };
    updateQuestion(index, { ...question, options: newOptions });
  };
  
  const handleCorrectAnswerChange = (optionId: string) => {
    let newCorrectAnswer = [...question.correctAnswer];
    if (question.type === 'multiple-choice') {
      if (newCorrectAnswer.includes(optionId)) {
        newCorrectAnswer = newCorrectAnswer.filter((id) => id !== optionId);
      } else {
        newCorrectAnswer.push(optionId);
      }
    } else { // true-false, short-answer
      newCorrectAnswer = [optionId];
    }
    updateQuestion(index, { ...question, correctAnswer: newCorrectAnswer });
  };

  const addOption = () => {
    const newOptions = [
      ...question.options,
      { id: `option-${Date.now()}`, text: "" },
    ];
    updateQuestion(index, { ...question, options: newOptions });
  };

  const removeOption = (optionIndex: number) => {
    const newOptions = [...question.options];
    newOptions.splice(optionIndex, 1);
    updateQuestion(index, { ...question, options: newOptions });
  };

  const handleEnhanceClick = async () => {
    if (!question.text) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Please enter a question before using the AI assistant.",
        });
        return;
    }
    setIsAiLoading(true);
    const result = await enhanceQuestionAction(question.text);
    setIsAiLoading(false);

    if (result.success && result.data) {
      setAiSuggestions(result.data);
      setIsAiDialogOpen(true);
    } else {
       toast({
        variant: "destructive",
        title: "AI Assistant Error",
        description: result.error || "Could not fetch suggestions.",
      });
    }
  };

  const applyAISuggestion = (suggestion: string) => {
    updateQuestion(index, { ...question, text: suggestion });
    setIsAiDialogOpen(false);
  };
  
  const getQuestionTypeLabel = (type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  return (
    <div className="p-6 border rounded-lg bg-card relative">
      <AISuggestionDialog
        isOpen={isAiDialogOpen}
        setIsOpen={setIsAiDialogOpen}
        suggestions={aiSuggestions}
        onApply={applyAISuggestion}
        originalQuestion={question.text}
      />
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-primary">
          Question {index + 1} ({getQuestionTypeLabel(question.type)})
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeQuestion(index)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-4">
        <div className="relative">
          <Label htmlFor={`question-text-${index}`}>Question Text</Label>
          <Textarea
            id={`question-text-${index}`}
            name="text"
            value={question.text}
            onChange={handleQuestionChange}
            placeholder="What is the capital of France?"
            className="pr-12"
          />
           <Button
              variant="ghost"
              size="icon"
              className="absolute top-7 right-1"
              onClick={handleEnhanceClick}
              disabled={isAiLoading}
              title="Enhance with AI"
            >
              <Wand2 className={`h-5 w-5 ${isAiLoading ? "animate-pulse" : ""}`} />
            </Button>
        </div>

        { (question.type === "multiple-choice" || question.type === "true-false") && (
          <div>
            <Label>Options</Label>
            { question.type === 'multiple-choice' ? (
              <div className="space-y-2 mt-2">
                {question.options.map((option, optionIndex) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`correct-answer-${index}-${optionIndex}`}
                      checked={question.correctAnswer.includes(option.id)}
                      onCheckedChange={() => handleCorrectAnswerChange(option.id)}
                    />
                    <Input
                      value={option.text}
                      onChange={(e) => handleOptionChange(optionIndex, e)}
                      placeholder={`Option ${optionIndex + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(optionIndex)}
                      disabled={question.options.length <= 2}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                 <Button variant="outline" size="sm" onClick={addOption}>
                  <Plus className="mr-2 h-4 w-4" /> Add Option
                </Button>
              </div>
            ) : ( // True/False
              <RadioGroup
                className="mt-2"
                value={question.correctAnswer[0]}
                onValueChange={handleCorrectAnswerChange}
              >
                {question.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={`${question.id}-${option.id}`} />
                    <Label htmlFor={`${question.id}-${option.id}`}>{option.text}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>
        )}

        { (question.type === "short-answer" || question.type === "fill-in-the-blank") &&
          <div>
            <Label>Correct Answer</Label>
            <Input 
              value={question.correctAnswer[0] || ''}
              onChange={(e) => handleCorrectAnswerChange(e.target.value)}
              placeholder="Enter the correct answer"
              className="mt-1"
            />
             <p className="text-xs text-muted-foreground mt-1">
              For short answer, this is an exact match. Case-insensitive.
            </p>
          </div>
        }

        <div>
          <Label htmlFor={`question-points-${index}`}>Points</Label>
          <Input
            id={`question-points-${index}`}
            name="points"
            type="number"
            value={question.points}
            onChange={handleQuestionChange}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
}
