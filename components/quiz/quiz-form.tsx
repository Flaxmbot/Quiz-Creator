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
import { getQuiz, getUserProfile } from "@/lib/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import type { GenerateQuizOutput } from "@/ai/flows/generate-quiz";
import { QuizSettings } from "./quiz-settings";
import { handleGenericError } from "@/lib/error-handling";
import { createQuizAction, updateQuizAction } from "@/app/actions/quiz";
import type { User } from "@/lib/types";

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
  const duplicateQuizId = searchParams.get('duplicate');
  const duplicateTitle = searchParams.get('title');
  const [isSaving, setIsSaving] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editQuizId || !!duplicateQuizId);

  const [quiz, setQuiz] = useState<Omit<Quiz, "id" | "authorId" | "createdAt">>({
    title: "",
    description: "",
    questions: [],
    isPublished: false,
    allowRetakes: true,
    showCorrectAnswers: true,
    randomizeQuestions: false,
  });

  // Load existing quiz data for editing or duplication
  useEffect(() => {
    async function loadQuiz() {
      const quizIdToLoad = editQuizId || duplicateQuizId;
      if (quizIdToLoad && user) {
        setIsLoading(true);
        try {
          const existingQuiz = await getQuiz(quizIdToLoad);
          if (existingQuiz && (existingQuiz.authorId === user.uid || duplicateQuizId)) {
            // For duplication, we need to generate new IDs for questions and options
            const processedQuestions = duplicateQuizId ? existingQuiz.questions.map(question => ({
              ...question,
              id: `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              options: question.options.map((option, index) => ({
                ...option,
                id: `option-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
              }))
            })) : existingQuiz.questions;

            setQuiz({
              title: duplicateTitle || existingQuiz.title,
              description: existingQuiz.description,
              questions: processedQuestions,
              timeLimit: existingQuiz.timeLimit,
              isPublished: duplicateQuizId ? false : (existingQuiz.isPublished || false), // Duplicates are always unpublished
              allowRetakes: existingQuiz.allowRetakes || true,
              showCorrectAnswers: existingQuiz.showCorrectAnswers || true,
              randomizeQuestions: existingQuiz.randomizeQuestions || false,
              category: existingQuiz.category,
              tags: existingQuiz.tags,
            });
            
            if (duplicateQuizId) {
              toast({
                title: "Quiz Duplicated",
                description: "Quiz has been loaded for duplication. Make your changes and save.",
              });
            }
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
  }, [editQuizId, duplicateQuizId, duplicateTitle, user, loading, router, toast]);

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
       newQuestion.correctAnswer = [];
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
    const convertedQuestions: Question[] = generatedQuiz.questions.map((q, index) => {
      const questionId = `question-${Date.now()}-${index}`;

      const newOptions = q.options?.map((opt, optIndex) => ({
        id: `option-${questionId}-${optIndex}`,
        text: opt.text,
      })) || [];

      let newCorrectAnswer: string[] = [];
      if (q.type === 'multiple-choice' || q.type === 'true-false') {
        // The AI returns an array of indices as strings, e.g., ["0", "2"]
        newCorrectAnswer = q.correctAnswer
          .map(ans_idx_str => {
            const ans_idx = parseInt(ans_idx_str, 10);
            if (!isNaN(ans_idx) && ans_idx >= 0 && ans_idx < newOptions.length) {
              return newOptions[ans_idx].id;
            }
            return null; // Should not happen if AI follows prompt
          })
          .filter((id): id is string => id !== null);
      } else {
        // For short-answer or fill-in-the-blank, the answer is the text itself
        newCorrectAnswer = q.correctAnswer;
      }

      return {
        id: questionId,
        text: q.text,
        type: q.type,
        options: newOptions,
        correctAnswer: newCorrectAnswer,
        points: q.points,
      };
    });

    setQuiz({
      title: generatedQuiz.title,
      description: generatedQuiz.description,
      questions: convertedQuestions,
    });
  };

  const handleSave = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to save a quiz." });
      return;
    }

    if (!quiz.title) {
      toast({ variant: "destructive", title: "Error", description: "Quiz title is required." });
      return;
    }

    if (quiz.questions.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Please add at least one question." });
      return;
    }

    setIsSaving(true);

    try {
      const result = editQuizId
        ? await updateQuizAction(editQuizId, quiz, user.uid)
        : await createQuizAction(quiz, user.uid);

      if (result.success) {
        toast({
          title: editQuizId ? "Quiz Updated!" : "Quiz Saved!",
          description: `Your quiz has been successfully ${editQuizId ? 'updated' : 'saved'}.`,
        });
        router.push("/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: editQuizId ? "Update Error" : "Save Error",
          description: result.error,
        });
      }
    } catch {
      // This is for network errors or other unexpected issues with the server action call
      toast({
        variant: "destructive",
        title: "An Unexpected Error Occurred",
        description: "Something went wrong. Please try again later.",
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
        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base sm:text-lg font-semibold">Quiz Title</Label>
            <Input
              id="title"
              name="title"
              value={quiz.title}
              onChange={handleQuizDetailChange}
              placeholder="e.g., World History I"
              className="w-full touch-target"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base sm:text-lg font-semibold">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={quiz.description}
              onChange={handleQuizDetailChange}
              placeholder="A brief description of what this quiz covers."
              className="w-full min-h-[100px] touch-target resize-vertical"
              rows={4}
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

      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isSaving} className="w-full sm:flex-1 touch-target" size="sm">
                  <PlusCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">Add Question</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => addQuestion("multiple-choice")} className="touch-target">
                  Multiple Choice
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addQuestion("true-false")} className="touch-target">
                  True/False
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addQuestion("short-answer")} className="touch-target">
                  Short Answer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addQuestion("fill-in-the-blank")} className="touch-target">
                  Fill in the Blank
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              onClick={() => setIsAIGeneratorOpen(true)}
              disabled={isSaving}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full sm:flex-1 touch-target"
              size="sm"
            >
              <Wand2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Generate with AI</span>
            </Button>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isSaving || loading} 
            className="w-full lg:w-auto lg:min-w-[140px] touch-target cyber-button" 
            size="sm"
          >
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
        
        {quiz.questions.length > 0 && (
          <div className="text-center p-3 bg-muted/30 rounded-lg border border-dashed">
            <p className="text-xs sm:text-sm text-muted-foreground">
              <span className="font-semibold">{quiz.questions.length}</span> question{quiz.questions.length !== 1 ? 's' : ''} added
              {quiz.questions.reduce((acc, q) => acc + q.points, 0) > 0 && (
                <> • Total points: <span className="font-semibold">{quiz.questions.reduce((acc, q) => acc + q.points, 0)}</span></>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
