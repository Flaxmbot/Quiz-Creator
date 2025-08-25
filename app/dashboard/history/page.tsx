"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuizSubmission, Quiz } from "@/lib/types";
import { Clock, Trophy, Calendar, BookOpen, CheckCircle, XCircle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { getUserSubmissions, getQuiz } from "@/lib/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { handleGenericError } from "@/lib/error-handling";
import { format } from 'date-fns';

interface SubmissionWithQuiz extends QuizSubmission {
  quiz?: Quiz;
}

export default function QuizHistoryPage() {
  const [user, loading] = useAuthState(auth);
  const [submissions, setSubmissions] = useState<SubmissionWithQuiz[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubmissions = async () => {
    if (user) {
      try {
        setIsDataLoading(true);
        const userSubmissions = await getUserSubmissions(user.uid);
        
        // Fetch quiz details for each submission
        const submissionsWithQuizzes = await Promise.all(
          userSubmissions.map(async (submission) => {
            try {
              const quiz = await getQuiz(submission.quizId);
              return { ...submission, quiz: quiz || undefined };
            } catch (error) {
              return submission; // Return submission without quiz if fetch fails
            }
          })
        );
        
        setSubmissions(submissionsWithQuizzes);
      } catch (error) {
        const appError = handleGenericError(error);
        toast({
          variant: 'destructive',
          title: 'Error loading quiz history',
          description: appError.message,
        });
      } finally {
        setIsDataLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [user]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (score >= 80) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (score >= 70) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const getPerformanceIcon = (score: number) => {
    if (score >= 90) return <Trophy className="h-4 w-4" />;
    if (score >= 70) return <CheckCircle className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

  const averageScore = submissions.length > 0
    ? submissions.reduce((acc, s) => acc + (s.score || 0), 0) / submissions.length
    : 0;

  const totalQuizzes = submissions.length;
  const passedQuizzes = submissions.filter(s => (s.score || 0) >= 70).length;

  if (loading || isDataLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="space-y-3 sm:space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-3 sm:space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Quiz History
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Review your completed quizzes and track your learning progress.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="futuristic-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Completed</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-400">{totalQuizzes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="futuristic-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Passed</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-400">{passedQuizzes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="futuristic-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Avg Score</p>
                <p className={`text-lg sm:text-2xl font-bold ${getScoreColor(averageScore)}`}>
                  {Math.round(averageScore)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="futuristic-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Pass Rate</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-400">
                  {totalQuizzes > 0 ? Math.round((passedQuizzes / totalQuizzes) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quiz History List */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground">
          Recent Submissions ({submissions.length})
        </h2>
        
        {submissions.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No Quiz History</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              You haven&apos;t completed any quizzes yet. Start taking quizzes to see your progress here!
            </p>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center px-4 py-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg transition-colors"
            >
              Browse Quizzes
            </Link>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {submissions.map((submission) => (
              <Card key={submission.id} className="futuristic-card hover:neon-glow transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm sm:text-base font-semibold line-clamp-1">
                      {submission.quiz?.title || 'Quiz Title Unavailable'}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {getPerformanceIcon(submission.score || 0)}
                    </div>
                  </div>
                  <CardDescription className="text-xs sm:text-sm line-clamp-2">
                    {submission.quiz?.description || 'No description available'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={`${getScoreBadgeColor(submission.score || 0)} text-xs sm:text-sm`}>
                      {submission.score?.toFixed(1) || 0}%
                    </Badge>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(submission.submittedAt instanceof Date ? submission.submittedAt : submission.submittedAt.toDate(), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground gap-3">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {submission.quiz?.questions?.length || 0} questions
                    </span>
                    {submission.timeSpent && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.round(submission.timeSpent / 60)} min
                      </span>
                    )}
                  </div>

                  {submission.quiz?.category && (
                    <Badge variant="outline" className="text-xs">
                      {submission.quiz.category}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}