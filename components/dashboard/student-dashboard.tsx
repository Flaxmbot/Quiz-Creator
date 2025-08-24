"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Quiz, QuizSubmission } from "@/lib/types";
import { Clock, PlayCircle, Trophy, BookOpen, Users, Star, Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { getAllTeacherQuizzes, getUserSubmissions } from "@/lib/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { handleGenericError } from "@/lib/error-handling";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StudentDashboardProps {
  className?: string;
}

export function StudentDashboard({ className }: StudentDashboardProps) {
  const [user, loading] = useAuthState(auth);
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [featuredQuizzes, setFeaturedQuizzes] = useState<Quiz[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<QuizSubmission[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const { toast } = useToast();

  const fetchData = async () => {
    if (user) {
      setIsDataLoading(true);
      console.log("StudentDashboard: Fetching data for user:", user.uid);
      
      // Fetch each data source independently to handle partial failures
      const promises = [
        getAllTeacherQuizzes().catch(error => {
          console.error("StudentDashboard: Error fetching teacher quizzes:", error);
          return []; // Return empty array on error
        }),
        getUserSubmissions(user.uid).catch(error => {
          console.error("StudentDashboard: Error fetching user submissions:", error);
          return []; // Return empty array on error
        })
      ];

      try {
        const results = await Promise.allSettled(promises);
        
        // Extract results with proper typing, defaulting to empty arrays for failed promises
        const teacherQuizzesResult = results[0].status === 'fulfilled' ? results[0].value as Quiz[] : [];
        const submissionsResult = results[1].status === 'fulfilled' ? results[1].value as QuizSubmission[] : [];
        
        // Debug logging
        console.log("StudentDashboard: Teacher quizzes fetched:", teacherQuizzesResult.length);
        console.log("StudentDashboard: Teacher quizzes data:", teacherQuizzesResult);
        console.log("StudentDashboard: User submissions fetched:", submissionsResult.length);
        console.log("StudentDashboard: User submissions data:", submissionsResult);
        
        setAvailableQuizzes(teacherQuizzesResult);
        setFeaturedQuizzes([]); // No longer fetching featured quizzes
        setUserSubmissions(submissionsResult);

        // Show a warning if some data failed to load
        const failedPromises = results.filter(p => p.status === 'rejected');
        if (failedPromises.length > 0) {
          console.warn(`StudentDashboard: ${failedPromises.length} data sources failed to load`);
          toast({
            variant: 'default',
            title: 'Partial data loading',
            description: 'Some quiz data may not be available at the moment.',
          });
        }
        
      } catch (error) {
        console.error("StudentDashboard: Unexpected error in fetchData:", error);
        const appError = handleGenericError(error);
        toast({
          variant: 'destructive',
          title: 'Error loading data',
          description: appError.message,
        });
      } finally {
        setIsDataLoading(false);
      }
    }
  };

  useEffect(() => {
    console.log("StudentDashboard useEffect triggered");
    fetchData();
  }, [user]);

  const hasUserTakenQuiz = (quizId: string) => {
    return userSubmissions.some(submission => submission.quizId === quizId);
  };

  const getUserQuizScore = (quizId: string) => {
    const submission = userSubmissions.find(s => s.quizId === quizId);
    return submission?.score;
  };

  const filteredQuizzes = availableQuizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || quiz.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(availableQuizzes.map(quiz => quiz.category).filter(Boolean)));

  if (loading || isDataLoading) {
    return (
      <div className={`space-y-6 sm:space-y-8 ${className}`}>
        <div className="space-y-3 sm:space-y-4">
          <Skeleton className="h-8 w-64" />
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
    <div className={`space-y-6 sm:space-y-8 ${className}`}>
      {/* Header */}
      <div className="space-y-3 sm:space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Available Quizzes from All Teachers
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Discover and take published quizzes created by all teachers. Track your progress and improve your knowledge!
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="futuristic-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Available</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-400">{availableQuizzes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="futuristic-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Completed</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-400">{userSubmissions.length}</p>
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
                <p className="text-lg sm:text-2xl font-bold text-green-400">
                  {userSubmissions.length > 0
                    ? Math.round(userSubmissions.reduce((acc, s) => acc + (s.score || 0), 0) / userSubmissions.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="futuristic-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Categories</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-400">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Quizzes section removed */}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 sm:pl-10 text-sm sm:text-base"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
            <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category || "uncategorized"}>
                {category || "Uncategorized"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* All Quizzes */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground">
          All Quizzes ({filteredQuizzes.length})
        </h2>
        {filteredQuizzes.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No Quizzes Available</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              {searchTerm || filterCategory !== "all"
                ? "Try adjusting your search or filter criteria."
                : "No published quizzes from teachers are available at the moment. Check back later!"}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Debug info: Available quizzes: {availableQuizzes.length}
            </p>
            {(searchTerm || filterCategory !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterCategory("all");
                }}
                className="text-sm"
              >
                Clear Filters
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredQuizzes.map((quiz) => (
              <Card key={quiz.id} className="futuristic-card hover:neon-glow transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm sm:text-base font-semibold">
                      {quiz.title}
                    </CardTitle>
                    {hasUserTakenQuiz(quiz.id) && (
                      <Badge variant="secondary" className="text-xs">
                        Completed
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs sm:text-sm">
                    {quiz.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground gap-3">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {quiz.questions?.length || 0} questions
                    </span>
                    {quiz.timeLimit && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {quiz.timeLimit} min
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {quiz.category && (
                      <Badge variant="outline" className="text-xs">
                        {quiz.category}
                      </Badge>
                    )}
                    {quiz.submissionCount && quiz.submissionCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {quiz.submissionCount} completed
                      </span>
                    )}
                  </div>
                  {hasUserTakenQuiz(quiz.id) && (
                    <div className="text-xs text-green-400 font-medium">
                      Your Score: {getUserQuizScore(quiz.id)}%
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0">
                  <Link href={`/quiz/${quiz.id}`} className="w-full">
                    <Button className="w-full text-xs sm:text-sm touch-manipulation touch-target">
                      <PlayCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      {hasUserTakenQuiz(quiz.id) ? "Retake Quiz" : "Start Quiz"}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}