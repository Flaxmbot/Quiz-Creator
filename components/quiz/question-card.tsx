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
    const { name, value } = e.target;
    // Convert points to number if the field is points
    const newValue = name === 'points' ? parseInt(value, 10) || 0 : value;
    updateQuestion(index, { ...question, [name]: newValue });
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
    <div className="p-4 sm:p-6 border rounded-lg bg-card relative">
      <AISuggestionDialog
        isOpen={isAiDialogOpen}
        setIsOpen={setIsAiDialogOpen}
        suggestions={aiSuggestions}
        onApply={applyAISuggestion}
        originalQuestion={question.text}
      />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="flex justify-between items-start gap-2 sm:gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-primary flex-1 min-w-0">
            <span className="block sm:hidden">Q{index + 1}</span>
            <span className="hidden sm:block">Question {index + 1}</span>
            <span className="block text-xs sm:text-sm font-normal text-muted-foreground mt-1">
              ({getQuestionTypeLabel(question.type)})
            </span>
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeQuestion(index)}
            className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 sm:hidden touch-target"
          >
            <Trash className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeQuestion(index)}
          className="hidden sm:flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 touch-target self-start"
        >
          <Trash className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
      <div className="space-y-3 sm:space-y-4">
        <div className="relative">
          <Label htmlFor={`question-text-${index}`} className="text-sm">Question Text</Label>
          <Textarea
            id={`question-text-${index}`}
            name="text"
            value={question.text}
            onChange={handleQuestionChange}
            placeholder="What is the capital of France?"
            className="pr-10 sm:pr-12 text-sm sm:text-base"
            rows={3}
          />
           <Button
              variant="ghost"
              size="icon"
              className="absolute top-7 right-1 h-6 w-6 sm:h-8 sm:w-8"
              onClick={handleEnhanceClick}
              disabled={isAiLoading}
              title="Enhance with AI"
            >
              <Wand2 className={`h-3 w-3 sm:h-4 sm:w-4 ${isAiLoading ? "animate-pulse" : ""}`} />
            </Button>
        </div>

        { (question.type === "multiple-choice" || question.type === "true-false") && (
          <div>
            <Label className="text-sm">Options</Label>
            { question.type === 'multiple-choice' ? (
              <div className="space-y-2 mt-2">
                {question.options.map((option, optionIndex) => (
                  <div key={option.id} className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/50 touch-manipulation">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <Checkbox
                        id={`correct-answer-${index}-${optionIndex}`}
                        checked={question.correctAnswer.includes(option.id)}
                        onCheckedChange={() => handleCorrectAnswerChange(option.id)}
                        className="flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6"
                      />
                      <Input
                        value={option.text}
                        onChange={(e) => handleOptionChange(optionIndex, e)}
                        placeholder={`Option ${optionIndex + 1}`}
                        className="text-sm sm:text-base flex-1 min-w-0 touch-target"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(optionIndex)}
                      disabled={question.options.length <= 2}
                      className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 touch-target self-center sm:self-start"
                    >
                      <Trash className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                ))}
                 <Button variant="outline" size="sm" onClick={addOption} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
                  <span className="text-xs sm:text-sm">Add Option</span>
                </Button>
              </div>
            ) : ( // True/False
              <RadioGroup
                className="mt-2"
                value={question.correctAnswer[0]}
                onValueChange={handleCorrectAnswerChange}
              >
                {question.options.map((option) => (
                  <div key={option.id} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/50 touch-manipulation">
                    <RadioGroupItem value={option.id} id={`${question.id}-${option.id}`} className="flex-shrink-0 mt-0.5 h-5 w-5 sm:h-6 sm:w-6" />
                    <Label htmlFor={`${question.id}-${option.id}`} className="text-sm sm:text-base cursor-pointer flex-1 min-w-0 leading-relaxed touch-target">{option.text}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>
        )}

        { (question.type === "short-answer" || question.type === "fill-in-the-blank") &&
        <div className="space-y-2">
          <Label htmlFor={`correct-answer-${index}`} className="text-sm font-medium">Correct Answer</Label>
          <Input
            id={`correct-answer-${index}`}
            value={question.correctAnswer[0] || ''}
            onChange={(e) => handleCorrectAnswerChange(e.target.value)}
            placeholder="Enter the correct answer"
            className="w-full touch-target"
          />
           <p className="text-xs text-muted-foreground leading-relaxed">
            For short answer, this is an exact match. Case-insensitive.
          </p>
        </div>
        }

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <Label htmlFor={`question-points-${index}`} className="text-sm font-medium sm:min-w-fit">Points</Label>
          <Input
            id={`question-points-${index}`}
            name="points"
            type="number"
            min="0"
            max="100"
            value={question.points}
            onChange={handleQuestionChange}
            className="w-full sm:w-24 touch-target"
          />
        </div>
      </div>
    </div>
  );
}
