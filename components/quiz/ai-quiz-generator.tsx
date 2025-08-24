"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Wand2, Loader2 } from "lucide-react";
import { generateQuizAction } from "@/app/actions/quiz";
import { useToast } from "@/hooks/use-toast";
import type { GenerateQuizInput, GenerateQuizOutput } from "@/ai/flows/generate-quiz";
import type { QuestionType } from "@/lib/types";

interface AIQuizGeneratorProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onQuizGenerated: (quiz: GenerateQuizOutput) => void;
}

export function AIQuizGenerator({
  isOpen,
  setIsOpen,
  onQuizGenerated,
}: AIQuizGeneratorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<GenerateQuizInput>({
    topic: "",
    questionTypes: ["multiple-choice"],
    numberOfQuestions: 5,
    difficultyLevel: "medium",
    additionalInstructions: "",
  });

  const questionTypeOptions: { value: QuestionType; label: string }[] = [
    { value: "multiple-choice", label: "Multiple Choice" },
    { value: "true-false", label: "True/False" },
    { value: "short-answer", label: "Short Answer" },
    { value: "fill-in-the-blank", label: "Fill in the Blank" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "numberOfQuestions" ? parseInt(value) || 1 : value,
    }));
  };

  const handleQuestionTypeChange = (questionType: QuestionType, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      questionTypes: checked
        ? [...prev.questionTypes, questionType]
        : prev.questionTypes.filter(type => type !== questionType),
    }));
  };

  const handleDifficultyChange = (difficulty: "easy" | "medium" | "hard") => {
    setFormData(prev => ({
      ...prev,
      difficultyLevel: difficulty,
    }));
  };

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a topic for the quiz.",
      });
      return;
    }

    if (formData.questionTypes.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select at least one question type.",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateQuizAction(formData);
      
      if (result.success && result.data) {
        onQuizGenerated(result.data);
        setIsOpen(false);
        toast({
          title: "Quiz Generated!",
          description: "Your AI-generated quiz has been created successfully.",
        });
        // Reset form
        setFormData({
          topic: "",
          questionTypes: ["multiple-choice"],
          numberOfQuestions: 5,
          difficultyLevel: "medium",
          additionalInstructions: "",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Generation Error",
          description: result.error || "Failed to generate quiz.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while generating the quiz.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="text-primary" />
            Generate Quiz with AI
          </DialogTitle>
          <DialogDescription>
            Let AI create a complete quiz for you. Just provide the topic and preferences.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 sm:gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-sm sm:text-base">Topic *</Label>
            <Input
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleInputChange}
              placeholder="e.g., World War II, Photosynthesis, JavaScript Basics"
              disabled={isGenerating}
              className="text-sm sm:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm sm:text-base">Question Types *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {questionTypeOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2 p-2 sm:p-3 rounded-lg has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-all">
                  <Checkbox
                    id={option.value}
                    checked={formData.questionTypes.includes(option.value)}
                    onCheckedChange={(checked) =>
                      handleQuestionTypeChange(option.value, checked as boolean)
                    }
                    disabled={isGenerating}
                    className="h-4 w-4 sm:h-5 sm:w-5"
                  />
                  <Label htmlFor={option.value} className="text-xs sm:text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberOfQuestions" className="text-sm sm:text-base">Number of Questions</Label>
            <Input
              id="numberOfQuestions"
              name="numberOfQuestions"
              type="number"
              min="1"
              max="20"
              value={formData.numberOfQuestions}
              onChange={handleInputChange}
              disabled={isGenerating}
              className="text-sm sm:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm sm:text-base">Difficulty Level</Label>
            <RadioGroup
              value={formData.difficultyLevel}
              onValueChange={handleDifficultyChange}
              disabled={isGenerating}
            >
              <div className="flex items-center space-x-2 p-2 sm:p-3 rounded-lg has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-all">
                <RadioGroupItem value="easy" id="easy" className="h-4 w-4 sm:h-5 sm:w-5" />
                <Label htmlFor="easy" className="text-xs sm:text-sm">Easy</Label>
              </div>
              <div className="flex items-center space-x-2 p-2 sm:p-3 rounded-lg has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-all">
                <RadioGroupItem value="medium" id="medium" className="h-4 w-4 sm:h-5 sm:w-5" />
                <Label htmlFor="medium" className="text-xs sm:text-sm">Medium</Label>
              </div>
              <div className="flex items-center space-x-2 p-2 sm:p-3 rounded-lg has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-all">
                <RadioGroupItem value="hard" id="hard" className="h-4 w-4 sm:h-5 sm:w-5" />
                <Label htmlFor="hard" className="text-xs sm:text-sm">Hard</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalInstructions" className="text-sm sm:text-base">Additional Instructions (Optional)</Label>
            <Textarea
              id="additionalInstructions"
              name="additionalInstructions"
              value={formData.additionalInstructions}
              onChange={handleInputChange}
              placeholder="Any specific requirements or context for the quiz..."
              disabled={isGenerating}
              className="text-sm sm:text-base"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isGenerating}
            className="touch-target"
          >
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating} className="touch-target">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Quiz
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
