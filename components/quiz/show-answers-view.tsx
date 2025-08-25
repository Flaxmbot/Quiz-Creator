"use client";

import React, { useState, useEffect } from "react";
import type { Quiz } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Eye, EyeOff, BookOpen, Award, Target, Clock, Loader2, Share2, Copy, Check } from "lucide-react";
import { getQuiz } from "@/lib/firestore";
import { handleGenericError } from "@/lib/error-handling";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export function ShowAnswersView({ quizId }: { quizId: string }) {
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswers, setShowAnswers] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const quizData = await getQuiz(quizId);
        if (quizData) {
          setQuiz(quizData);
        } else {
          setError("Quiz not found.");
          toast({
            variant: "destructive",
            title: "Quiz Not Found",
            description: "The quiz you're looking for doesn't exist.",
          });
        }
      } catch (e) {
        const appError = handleGenericError(e);
        setError(appError.message);
        toast({
          variant: "destructive",
          title: "Error Loading Quiz",
          description: appError.message,
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuiz();
  }, [quizId, toast]);

  const shareAnswers = async () => {
    const answersUrl = `${window.location.origin}/quiz/${quizId}/answers`;
    try {
      await navigator.clipboard.writeText(answersUrl);
      setCopied(true);
      toast({
        title: "Answer Key Link Copied!",
        description: "Quiz answer key link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive", 
        title: "Copy Failed",
        description: "Failed to copy answer key link to clipboard.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-4 text-lg">Loading Quiz Answers...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "An unexpected error occurred."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const getCorrectAnswerText = (question: any) => {
    const correctOptions = question.options.filter((option: any) => 
      question.correctAnswer.includes(option.id)
    );
    return correctOptions.map((option: any) => option.text).join(", ");
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'multiple-choice':
        return <Target className="w-4 h-4" />;
      case 'true-false':
        return <CheckCircle className="w-4 h-4" />;
      case 'short-answer':
      case 'fill-in-the-blank':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background p-3 sm:p-4 lg:p-8">
      {/* Header Section */}
      <header className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <Badge variant="secondary" className="text-sm">Answer Key</Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnswers(!showAnswers)}
              className="flex items-center gap-2"
            >
              {showAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAnswers ? "Hide Answers" : "Show Answers"}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={shareAnswers}
              className="flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copied ? "Copied!" : "Share"}
            </Button>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{quiz.title}</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">{quiz.description}</p>
        
        {/* Quiz Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/20 border">
            <Target className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Questions</p>
              <p className="font-semibold">{quiz.questions.length}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/20 border">
            <Award className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Points</p>
              <p className="font-semibold">{quiz.questions.reduce((sum, q) => sum + q.points, 0)}</p>
            </div>
          </div>
          
          {quiz.timeLimit && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/20 border">
              <Clock className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Time Limit</p>
                <p className="font-semibold">{quiz.timeLimit} min</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/20 border">
            <CheckCircle className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-semibold">{quiz.isPublished ? "Published" : "Draft"}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Progress</span>
            <span className="text-xs sm:text-sm font-medium text-primary">
              {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2 sm:h-3 w-full" />
        </div>
      </header>
      
      {/* Question Card */}
      <main className="flex-grow flex items-start sm:items-center justify-center">
        <Card className="w-full max-w-4xl futuristic-card">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getQuestionTypeIcon(currentQuestion.type)}
                  <Badge variant="outline" className="text-xs">
                    {currentQuestion.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
                  </Badge>
                </div>
                <CardTitle className="text-base sm:text-lg lg:text-xl leading-relaxed">
                  {currentQuestion.text}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="min-h-[200px] sm:min-h-[250px]">
            {/* Question Options */}
            <div className="space-y-3 sm:space-y-4">
              {currentQuestion.options.map((option, index) => {
                const isCorrect = currentQuestion.correctAnswer.includes(option.id);
                const isSelected = showAnswers && isCorrect;
                
                return (
                  <div
                    key={option.id}
                    className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg transition-all duration-200 relative overflow-hidden ${
                      isSelected
                        ? 'bg-green-500/15 border-green-500/50 shadow-sm ring-2 ring-green-500/30'
                        : 'bg-muted/20 border-border/20'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 left-0 w-full h-full bg-green-500/5 pointer-events-none"></div>
                    )}
                    <div className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 font-semibold text-sm flex-shrink-0 z-10 ${
                      isSelected
                        ? 'bg-green-500 border-green-500 text-white shadow-sm'
                        : 'bg-background border-border text-muted-foreground'
                    }`}>
                      {isSelected ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        String.fromCharCode(65 + index)
                      )}
                    </div>
                    <div className="flex-1 min-w-0 z-10">
                      <p className="text-sm sm:text-base leading-relaxed break-words">
                        {option.text}
                      </p>
                      {isSelected && (
                        <Badge variant="secondary" className="mt-2 text-xs bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">
                          <CheckCircle className="w-3 h-3 mr-1 inline" />
                          Correct Answer
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Answer Explanation */}
            {showAnswers && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold text-green-700 dark:text-green-300">Correct Answer</h3>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-sm sm:text-base font-medium">
                      {getCorrectAnswerText(currentQuestion)}
                    </p>
                  </div>

                  {(currentQuestion as any).explanation && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-muted-foreground">Explanation:</h4>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {(currentQuestion as any).explanation}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3 sm:gap-4 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between w-full">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className="w-full sm:w-auto sm:min-w-[120px] touch-target order-2 sm:order-1"
                size="sm"
              >
                <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Previous</span>
              </Button>
              
              {currentQuestionIndex < quiz.questions.length - 1 ? (
                <Button
                  onClick={handleNext}
                  className="w-full sm:w-auto sm:min-w-[120px] touch-target cyber-button order-1 sm:order-2"
                  size="sm"
                >
                  <span className="text-xs sm:text-sm">Next Question</span>
                  <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => router.push(`/results/${quizId}`)}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto sm:min-w-[140px] touch-target order-1 sm:order-2"
                  size="sm"
                >
                  <Award className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">View Results</span>
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
