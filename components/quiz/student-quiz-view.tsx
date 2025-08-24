"use client";

import React, { useState, useEffect } from "react";
import type { Quiz } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Loader2 } from "lucide-react";
import { getQuiz, submitQuiz } from "@/lib/firestore";
import { handleGenericError } from "@/lib/error-handling";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "../ui/input";


export function StudentQuizView({ quizId }: { quizId: string }) {
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(new Date());

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const quizData = await getQuiz(quizId);
        if (quizData) {
          if (!quizData.isPublished) {
            setError("This quiz is not currently available.");
            toast({
              variant: "destructive",
              title: "Quiz Not Available",
              description: "This quiz is not currently published.",
            });
            return;
          }
          setQuiz(quizData);
          if (quizData.timeLimit) {
            setTimeLeft(quizData.timeLimit * 60);
          }
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

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isFinished) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime !== null && prevTime <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto-submit when time is up
          return 0;
        }
        return prevTime! - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-4 text-lg">Loading Quiz...</p>
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

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: Array.isArray(answer) ? answer : [answer]
    }));
  };
  
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

  const handleSubmit = async () => {
    if (isFinished || !quiz || !user) return;
    
    setIsSubmitting(true);
    try {
      // Calculate score
      let score = 0;
      let totalPoints = 0;
      
      for (const question of quiz.questions) {
        totalPoints += question.points;
        const userAnswers = answers[question.id] || [];
        
        // Check if answers are correct
        if (question.type === 'multiple-choice' || question.type === 'true-false') {
          const correctAnswers = question.correctAnswer;
          const isCorrect = userAnswers.length === correctAnswers.length && 
            userAnswers.every(answer => correctAnswers.includes(answer));
          if (isCorrect) {
            score += question.points;
          }
        }
      }
      
      const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      const finalScore = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
      
      await submitQuiz({
        quizId: quiz.id,
        userId: user.uid,
        userEmail: user.email || '',
        userName: user.displayName || user.email || 'Anonymous',
        answers: answers,
        score: finalScore,
        totalPoints: totalPoints,
        timeSpent: timeSpent,
        isCompleted: true,
      });
      
      toast({
        title: "Quiz Submitted Successfully",
        description: `Your score: ${finalScore.toFixed(1)}%`,
      });
      
      setIsFinished(true);
    } catch (error) {
      const appError = handleGenericError(error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: appError.message,
      });
      setIsSubmitting(false);
    }
  };
  
  if (isFinished) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <div className="mx-auto bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="mt-4">Quiz Submitted!</CardTitle>
            <CardDescription>Thank you for completing the quiz. Your results will be available shortly.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>You have successfully submitted the quiz: <strong>{quiz.title}</strong>.</p>
          </CardContent>
           <CardFooter>
            <Button className="w-full" asChild>
                <a href="/dashboard">Back to Dashboard</a>
            </Button>
           </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background p-4 sm:p-8">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">{quiz.title}</h1>
        <p className="text-muted-foreground">{quiz.description}</p>
        <div className="mt-4 flex items-center justify-between">
            <div className="w-full">
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground mt-1">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>
            </div>
            {timeLeft !== null && (
                <div className="flex items-center text-lg font-semibold text-primary ml-8 whitespace-nowrap">
                    <Clock className="mr-2 h-5 w-5" />
                    <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                </div>
            )}
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl leading-relaxed">{currentQuestion.text}</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[200px]">
            {currentQuestion.type === "multiple-choice" && (
                <div className="space-y-3">
                    {currentQuestion.options.map(option => (
                        <div key={option.id} className="flex flex-wrap items-center space-x-3 p-3 border rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-all">
                            <Checkbox id={`${currentQuestion.id}-${option.id}`}
                                onCheckedChange={(checked) => {
                                    const currentAnswers = answers[currentQuestion.id] || [];
                                    const newAnswers = checked ? [...currentAnswers, option.id] : currentAnswers.filter(id => id !== option.id);
                                    handleAnswerChange(currentQuestion.id, newAnswers);
                                }}
                                checked={answers[currentQuestion.id]?.includes(option.id)}
                            />
                            <Label htmlFor={`${currentQuestion.id}-${option.id}`} className="text-base cursor-pointer flex-1">{option.text}</Label>
                        </div>
                    ))}
                </div>
            )}
             {currentQuestion.type === "true-false" && (
                <RadioGroup onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)} value={(answers[currentQuestion.id] || [])[0]}>
                    <div className="space-y-3">
                    {currentQuestion.options.map(option => (
                        <div key={option.id} className="flex flex-wrap items-center space-x-3 p-3 border rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-all">
                            <RadioGroupItem value={option.id} id={`${currentQuestion.id}-${option.id}`} />
                            <Label htmlFor={`${currentQuestion.id}-${option.id}`} className="text-base cursor-pointer flex-1">{option.text}</Label>
                        </div>
                    ))}
                    </div>
                </RadioGroup>
            )}
             {(currentQuestion.type === "short-answer" || currentQuestion.type === "fill-in-the-blank") && (
                <Input
                    type="text"
                    className="mt-2 w-full p-2 border rounded-md"
                    placeholder="Your answer..."
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    value={(answers[currentQuestion.id] || [])[0] || ""}
                />
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            {currentQuestionIndex < quiz.questions.length - 1 ? (
                 <Button onClick={handleNext}>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            ) : (
                <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Quiz'
                    )}
                </Button>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
