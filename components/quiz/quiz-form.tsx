"use client";

import React, { useState } from "react";
import type { Quiz, Question, QuestionType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Save, Wand2 } from "lucide-react";
import { QuestionCard } from "./question-card";
import { AIQuizGenerator } from "./ai-quiz-generator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { saveQuiz } from "@/lib/firestore";
import { useRouter } from "next/navigation";
import type { GenerateQuizOutput } from "@/ai/flows/generate-quiz";

const initialQuestionState: Question = {
  id: "",
  text: "",
  type: "multiple-choice",
  options: [
    { id: "option-1", text: "" },
    { id: "option-2", text: "" },
  ],
  correctAnswer: [],
  points: 10,
};

export function QuizForm() {
  const { toast } = useToast();
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);

  const [quiz, setQuiz] = useState<Omit<Quiz, "id" | "authorId" | "createdAt">>({
    title: "",
    description: "",
    questions: [],
  });

  const handleQuizDetailChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setQuiz({ ...quiz, [e.target.name]: e.target.value });
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      ...initialQuestionState,
      id: `question-${Date.now()}`,
      type,
      options: [],
      correctAnswer: [],
    };

    if (type === 'multiple-choice') {
      newQuestion.options = [
        { id: `option-${Date.now()}-1`, text: "" },
        { id: `option-${Date.now()}-2`, text: "" },
      ];
    } else if (type === 'true-false') {
      newQuestion.options = [
        { id: `option-${Date.now()}-1`, text: 'True' },
        { id: `option-${Date.now()}-2`, text: 'False' },
      ];
       newQuestion.correctAnswer = [`option-${Date.now()}-1`]; // Default to true
    } else if (type === 'short-answer' || type === 'fill-in-the-blank') {
       newQuestion.options = [];
       newQuestion.correctAnswer = [''];
    }

    setQuiz({ ...quiz, questions: [...quiz.questions, newQuestion] });
  };

  const updateQuestion = (index: number, updatedQuestion: Question) => {
    const newQuestions = [...quiz.questions];
    newQuestions[index] = updatedQuestion;
    setQuiz({ ...quiz, questions: newQuestions });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = [...quiz.questions];
    newQuestions.splice(index, 1);
    setQuiz({ ...quiz, questions: newQuestions });
  };
  
  const handleAIQuizGenerated = (generatedQuiz: GenerateQuizOutput) => {
    // Convert AI-generated quiz to our format
    const convertedQuestions: Question[] = generatedQuiz.questions.map((q, index) => ({
      id: `question-${Date.now()}-${index}`,
      text: q.text,
      type: q.type,
      options: q.options?.map((opt, optIndex) => ({
        id: `option-${Date.now()}-${index}-${optIndex}`,
        text: opt.text,
      })) || [],
      correctAnswer: q.correctAnswer,
      points: q.points,
    }));

    setQuiz({
      title: generatedQuiz.title,
      description: generatedQuiz.description,
      questions: convertedQuestions,
    });
  };

  const handleSave = async () => {
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to save a quiz." });
        return;
    }
    if (!quiz.title) {
        toast({ variant: "destructive", title: "Validation Error", description: "Quiz title cannot be empty." });
        return;
    }
     if (quiz.questions.length === 0) {
        toast({ variant: "destructive", title: "Validation Error", description: "Please add at least one question." });
        return;
    }

    setIsSaving(true);
    try {
        await saveQuiz(quiz, user.uid);
        toast({
            title: "Quiz Saved!",
            description: "Your new quiz has been successfully saved.",
        });
        router.push("/dashboard");
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Save Error",
            description: "Could not save the quiz. Please try again.",
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <AIQuizGenerator
        isOpen={isAIGeneratorOpen}
        setIsOpen={setIsAIGeneratorOpen}
        onQuizGenerated={handleAIQuizGenerated}
      />

      <div className="p-6 border rounded-lg bg-card">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-lg">Quiz Title</Label>
            <Input
              id="title"
              name="title"
              value={quiz.title}
              onChange={handleQuizDetailChange}
              placeholder="e.g., World History I"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description" className="text-lg">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={quiz.description}
              onChange={handleQuizDetailChange}
              placeholder="A brief description of what this quiz covers."
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div id="questions-section" className="space-y-4">
        {quiz.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            index={index}
            question={question}
            updateQuestion={updateQuestion}
            removeQuestion={removeQuestion}
          />
        ))}
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isSaving}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => addQuestion("multiple-choice")}>
                Multiple Choice
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addQuestion("true-false")}>
                True/False
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addQuestion("short-answer")}>
                Short Answer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addQuestion("fill-in-the-blank")}>
                Fill in the Blank
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            onClick={() => setIsAIGeneratorOpen(true)}
            disabled={isSaving}
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Generate with AI
          </Button>
        </div>

        <Button onClick={handleSave} disabled={isSaving || loading}>
          {isSaving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Quiz</>}
        </Button>
      </div>
    </div>
  );
}
