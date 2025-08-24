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
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Load quiz session data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sessionKey = `quiz_session_${quizId}`;
      const savedSession = localStorage.getItem(sessionKey);
      
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          setCurrentQuestionIndex(session.currentQuestionIndex || 0);
          setAnswers(session.answers || {});
          setStartTime(new Date(session.startTime));
          // timeLeft will be calculated in fetchQuiz based on elapsed time
        } catch (error) {
          console.error('Failed to parse saved session:', error);
          localStorage.removeItem(sessionKey);
        }
      }
    }
  }, [quizId]);

  // Save quiz session data to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && startTime && !isFinished) {
      const sessionKey = `quiz_session_${quizId}`;
      const sessionData = {
        currentQuestionIndex,
        answers,
        startTime: startTime.toISOString(),
        quizId
      };
      localStorage.setItem(sessionKey, JSON.stringify(sessionData));
    }
  }, [currentQuestionIndex, answers, startTime, quizId, isFinished]);

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
          
          // Handle timing logic with persistence
          if (quizData.timeLimit) {
            const sessionKey = `quiz_session_${quizId}`;
            const savedSession = localStorage.getItem(sessionKey);
            
            if (savedSession) {
              try {
                const session = JSON.parse(savedSession);
                const sessionStartTime = new Date(session.startTime);
                const elapsed = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
                const remainingTime = Math.max(0, (quizData.timeLimit * 60) - elapsed);
                
                if (remainingTime <= 0) {
                  // Time is up, auto-submit
                  setTimeLeft(0);
                  setTimeout(() => {
                    if (!isFinished && !isSubmitting) {
                      handleSubmit();
                    }
                  }, 100);
                } else {
                  setTimeLeft(remainingTime);
                }
              } catch (error) {
                console.error('Failed to calculate remaining time:', error);
                // Start fresh
                const newStartTime = new Date();
                setStartTime(newStartTime);
                setTimeLeft(quizData.timeLimit * 60);
              }
            } else {
              // First time taking the quiz
              const newStartTime = new Date();
              setStartTime(newStartTime);
              setTimeLeft(quizData.timeLimit * 60);
            }
          } else if (!startTime) {
            // No time limit, but set start time for tracking
            setStartTime(new Date());
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

  // Warn user before leaving the page during quiz
  useEffect(() => {
    if (!isFinished && !isLoading) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'Your quiz progress will be saved, but you may lose time. Are you sure you want to leave?';
        return e.returnValue;
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [isFinished, isLoading]);
  
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
      
      const timeSpent = startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : 0;
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
      
      // Clear the session data after successful submission
      if (typeof window !== 'undefined') {
        const sessionKey = `quiz_session_${quizId}`;
        localStorage.removeItem(sessionKey);
      }
      
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
    <div className="flex flex-col min-h-screen bg-background p-3 sm:p-4 lg:p-8">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{quiz.title}</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">{quiz.description}</p>
        <div className="mt-3 sm:mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                    <Progress value={progress} className="h-2 sm:h-3" />
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>
                </div>
                {timeLeft !== null && (
                    <div className="flex items-center text-base sm:text-lg font-semibold text-primary whitespace-nowrap bg-primary/10 px-3 py-2 rounded-lg">
                        <Clock className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                    </div>
                )}
            </div>
        </div>
      </header>
      
      <main className="flex-grow flex items-start sm:items-center justify-center">
        <Card className="w-full max-w-4xl">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-base sm:text-lg lg:text-xl leading-relaxed">{currentQuestion.text}</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[150px] sm:min-h-[200px]">
            {currentQuestion.type === "multiple-choice" && (
                <div className="space-y-2 sm:space-y-3">
                    {currentQuestion.options.map(option => (
                        <div key={option.id} className="flex items-start space-x-3 p-3 sm:p-4 border rounded-lg has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-all touch-manipulation">
                            <Checkbox
                                id={`${currentQuestion.id}-${option.id}`}
                                onCheckedChange={(checked) => {
                                    const currentAnswers = answers[currentQuestion.id] || [];
                                    const newAnswers = checked ? [...currentAnswers, option.id] : currentAnswers.filter(id => id !== option.id);
                                    handleAnswerChange(currentQuestion.id, newAnswers);
                                }}
                                checked={answers[currentQuestion.id]?.includes(option.id)}
                                className="mt-0.5 h-5 w-5 sm:h-6 sm:w-6"
                            />
                            <Label htmlFor={`${currentQuestion.id}-${option.id}`} className="text-sm sm:text-base cursor-pointer flex-1 leading-relaxed touch-target">{option.text}</Label>
                        </div>
                    ))}
                </div>
            )}
             {currentQuestion.type === "true-false" && (
                <RadioGroup onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)} value={(answers[currentQuestion.id] || [])[0]}>
                    <div className="space-y-2 sm:space-y-3">
                    {currentQuestion.options.map(option => (
                        <div key={option.id} className="flex items-start space-x-3 p-3 sm:p-4 border rounded-lg has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-all touch-manipulation">
                            <RadioGroupItem value={option.id} id={`${currentQuestion.id}-${option.id}`} className="mt-0.5 h-5 w-5 sm:h-6 sm:w-6" />
                            <Label htmlFor={`${currentQuestion.id}-${option.id}`} className="text-sm sm:text-base cursor-pointer flex-1 leading-relaxed touch-target">{option.text}</Label>
                        </div>
                    ))}
                    </div>
                </RadioGroup>
            )}
             {(currentQuestion.type === "short-answer" || currentQuestion.type === "fill-in-the-blank") && (
                <Input
                    type="text"
                    className="mt-2 w-full p-3 sm:p-4 border rounded-lg text-sm sm:text-base touch-target"
                    placeholder="Type your answer here..."
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    value={(answers[currentQuestion.id] || [])[0] || ""}
                />
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between pt-4 sm:pt-6">
            <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className="w-full sm:w-auto order-2 sm:order-1 touch-target"
                size="sm"
            >
                <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Previous</span>
            </Button>
            {currentQuestionIndex < quiz.questions.length - 1 ? (
                 <Button
                    onClick={handleNext}
                    className="w-full sm:w-auto order-1 sm:order-2 touch-target"
                    size="sm"
                 >
                    <span className="text-xs sm:text-sm">Next</span>
                    <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
            ) : (
                <Button
                    onClick={handleSubmit}
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto order-1 sm:order-2 touch-target"
                    disabled={isSubmitting}
                    size="sm"
                >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        <span className="text-xs sm:text-sm">Submitting...</span>
                      </>
                    ) : (
                      <span className="text-xs sm:text-sm">Submit Quiz</span>
                    )}
                </Button>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
