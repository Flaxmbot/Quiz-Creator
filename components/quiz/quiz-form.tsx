"use client";

import React, { useState, useEffect } from "react";
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
import { saveQuiz, getQuiz, updateQuiz } from "@/lib/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import type { GenerateQuizOutput } from "@/ai/flows/generate-quiz";
import { QuizSettings } from "./quiz-settings";
import { handleGenericError } from "@/lib/error-handling";

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
  const searchParams = useSearchParams();
  const editQuizId = searchParams.get('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editQuizId);

  const [quiz, setQuiz] = useState<Omit<Quiz, "id" | "authorId" | "createdAt">>({
    title: "",
    description: "",
    questions: [],
    isPublished: false,
    allowRetakes: true,
    showCorrectAnswers: true,
    randomizeQuestions: false,
  });

  // Load existing quiz data for editing
  useEffect(() => {
    async function loadQuiz() {
      if (editQuizId && user) {
        setIsLoading(true);
        try {
          const existingQuiz = await getQuiz(editQuizId);
          if (existingQuiz && existingQuiz.authorId === user.uid) {
            setQuiz({
              title: existingQuiz.title,
              description: existingQuiz.description,
              questions: existingQuiz.questions,
              timeLimit: existingQuiz.timeLimit,
              isPublished: existingQuiz.isPublished || false,
              allowRetakes: existingQuiz.allowRetakes || true,
              showCorrectAnswers: existingQuiz.showCorrectAnswers || true,
              randomizeQuestions: existingQuiz.randomizeQuestions || false,
              category: existingQuiz.category,
              tags: existingQuiz.tags,
            });
          } else {
            toast({
              variant: "destructive",
              title: "Quiz Not Found",
              description: "The quiz you're trying to edit was not found or you don't have permission to edit it.",
            });
            router.push('/dashboard');
          }
        } catch (error) {
          const appError = handleGenericError(error);
          toast({
            variant: "destructive",
            title: "Error Loading Quiz",
            description: appError.message,
          });
          router.push('/dashboard');
        } finally {
          setIsLoading(false);
        }
      }
    }

    if (!loading) {
      loadQuiz();
    }
  }, [editQuizId, user, loading, router, toast]);

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
      if (editQuizId) {
        // Update existing quiz
        await updateQuiz(editQuizId, quiz, user.uid);
        toast({
          title: "Quiz Updated!",
          description: "Your quiz has been successfully updated.",
        });
      } else {
        // Create new quiz
        await saveQuiz(quiz, user.uid);
        toast({
          title: "Quiz Saved!",
          description: "Your new quiz has been successfully saved.",
        });
      }
      router.push("/dashboard");
    } catch (error) {
      const appError = handleGenericError(error);
      toast({
        variant: "destructive",
        title: editQuizId ? "Update Error" : "Save Error",
        description: appError.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="p-6 border rounded-lg bg-card">
          <div className="space-y-4">
            <div className="h-6 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-10 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AIQuizGenerator
        isOpen={isAIGeneratorOpen}
        setIsOpen={setIsAIGeneratorOpen}
        onQuizGenerated={handleAIQuizGenerated}
      />

      <div className="p-4 sm:p-6 border rounded-lg bg-card">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-base sm:text-lg">Quiz Title</Label>
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
            <Label htmlFor="description" className="text-base sm:text-lg">Description</Label>
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

      <QuizSettings
        quiz={quiz}
        onQuizChange={(updates) => setQuiz(prev => ({ ...prev, ...updates }))}
      />

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

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between sm:items-center">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isSaving} className="w-full sm:w-auto" size="sm">
                <PlusCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Add Question</span>
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
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full sm:w-auto"
            size="sm"
          >
            <Wand2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Generate with AI</span>
          </Button>
        </div>

        <Button onClick={handleSave} disabled={isSaving || loading} className="w-full sm:w-auto touch-target" size="sm">
          {isSaving
            ? (editQuizId ? "Updating..." : "Saving...")
            : (
              <>
                <Save className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">{editQuizId ? "Update Quiz" : "Save Quiz"}</span>
              </>
            )
          }
        </Button>
      </div>
    </div>
  );
}
