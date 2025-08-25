"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Quiz } from "@/lib/types";
import { FileText, MoreVertical, Clock, Edit, Trash, Share2, Eye, BarChart2 as ResultsIcon, Globe, Lock, PlusCircle, Copy, Check, Search, Filter, X, Files } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { getUserQuizzes, deleteQuiz, toggleQuizPublication, toggleQuizPublic, getUserProfile } from "@/lib/firestore";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import type { User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { handleGenericError } from "@/lib/error-handling";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DashboardPage() {
  const [user, loading] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [sortBy, setSortBy] = useState<"title" | "created" | "questions">("created");
  const [duplicatingQuizId, setDuplicatingQuizId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!user) return;

    setIsDataLoading(true);
    try {
      console.log("Fetching data for user:", user.uid);
      const [profile, userQuizzes] = await Promise.all([
        getUserProfile(user.uid),
        getUserQuizzes(user.uid)
      ]);
      
      console.log("User profile fetched:", profile);
      console.log("User quizzes fetched:", userQuizzes.length);
      
      setUserProfile(profile);
      setQuizzes(userQuizzes);
    } catch (error) {
      console.error("Error fetching data:", error);
      const appError = handleGenericError(error);
      toast({
        variant: "destructive",
        title: "Error Loading Data",
        description: appError.message,
      });
    } finally {
      setIsDataLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!loading) {
      fetchData();
    }
  }, [user, loading, fetchData]);

  const handleDeleteQuiz = async (quizId: string) => {
    if (!user) return;

    setDeletingQuizId(quizId);
    try {
      await deleteQuiz(quizId, user.uid);
      setQuizzes(prev => prev.filter(quiz => quiz.id !== quizId));
      toast({
        title: "Quiz Deleted",
        description: "The quiz has been deleted successfully.",
      });
    } catch (error) {
      const appError = handleGenericError(error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: appError.message,
      });
    } finally {
      setDeletingQuizId(null);
    }
  };

  const handleTogglePublication = async (quizId: string, isPublished: boolean) => {
    if (!user) return;

    try {
      await toggleQuizPublication(quizId, !isPublished, user.uid);
      setQuizzes(prev => prev.map(quiz =>
        quiz.id === quizId
          ? { ...quiz, isPublished: !isPublished }
          : quiz
      ));
      toast({
        title: isPublished ? "Quiz Unpublished" : "Quiz Published",
        description: isPublished
          ? "The quiz is no longer accessible to students."
          : "The quiz is now accessible to students.",
      });
    } catch (error) {
      const appError = handleGenericError(error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: appError.message,
      });
    }
  };

  const handleTogglePublic = async (quizId: string, isPublic: boolean) => {
    if (!user) return;

    try {
      await toggleQuizPublic(quizId, !isPublic, user.uid);
      setQuizzes(prev => prev.map(quiz =>
        quiz.id === quizId
          ? { ...quiz, isPublic: !isPublic }
          : quiz
      ));
      toast({
        title: isPublic ? "Quiz set to Private" : "Quiz set to Public",
        description: isPublic
          ? "The quiz is no longer publicly accessible."
          : "The quiz is now publicly accessible.",
      });
    } catch (error) {
      const appError = handleGenericError(error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: appError.message,
      });
    }
  };

  const handleDuplicateQuiz = async (quiz: Quiz) => {
    if (!user) return;

    setDuplicatingQuizId(quiz.id);
    try {
      // Create a URL with the quiz data to duplicate
      const duplicateParams = new URLSearchParams({
        duplicate: quiz.id,
        title: `${quiz.title} (Copy)`,
      });
      
      // Navigate to create page with duplication parameters
      window.location.href = `/create?${duplicateParams.toString()}`;
    } catch (error) {
      const appError = handleGenericError(error);
      toast({
        variant: "destructive",
        title: "Duplication Failed",
        description: appError.message,
      });
      setDuplicatingQuizId(null);
    }
  };

  const handleShareQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setShareModalOpen(true);
    setCopied(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Quiz link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy link to clipboard.",
      });
    }
  };

  const getQuizUrl = (quizId: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/quiz/${quizId}`;
    }
    return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/quiz/${quizId}`;
  };

  if (loading || isDataLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-12 w-40 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="futuristic-card">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-full mt-2 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2 rounded-lg" />
              </CardContent>
              <CardFooter className="flex gap-2">
                <Skeleton className="h-10 w-full rounded-lg" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="futuristic-card p-8 text-center">
          <CardContent>
            <h2 className="text-2xl font-bold text-muted-foreground mb-2">Authentication Required</h2>
            <p className="text-muted-foreground">Please log in to access your dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show student dashboard if user is a student
  if (userProfile?.role === 'student') {
    return (
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 max-w-7xl">
        <StudentDashboard />
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="futuristic-card p-12 text-center max-w-md mx-auto">
          <CardContent className="space-y-6">
            <div className="relative">
              <PlusCircle className="w-20 h-20 mx-auto text-primary/60" />
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl -z-10"></div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">No Quizzes Yet!</h2>
              <p className="text-muted-foreground">Start your teaching journey by creating your first interactive quiz.</p>
            </div>
            <Button asChild className="cyber-button mt-6 w-full">
              <Link href="/create">
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Your First Quiz
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter and sort quizzes based on search and filters
  const filteredAndSortedQuizzes = quizzes
    .filter(quiz => {
      const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "published" && quiz.isPublished) ||
        (statusFilter === "draft" && !quiz.isPublished);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "questions":
          return b.questions.length - a.questions.length;
        case "created":
        default:
          const bCreatedAt = b.createdAt ? (typeof b.createdAt === 'object' && 'toDate' in b.createdAt ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
          const aCreatedAt = a.createdAt ? (typeof a.createdAt === 'object' && 'toDate' in a.createdAt ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
          return bCreatedAt.getTime() - aCreatedAt.getTime();
      }
    });

  const totalQuizzes = quizzes.length;
  const publishedQuizzes = quizzes.filter(q => q.isPublished).length;
  const draftQuizzes = totalQuizzes - publishedQuizzes;
  const totalQuestions = quizzes.reduce((acc, q) => acc + q.questions.length, 0);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg mt-1 sm:mt-2">Manage your quizzes and track performance</p>
        </div>
        <Button asChild className="cyber-button w-full sm:w-auto touch-target">
          <Link href="/create">
            <PlusCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Create New Quiz
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="futuristic-card hover:neon-glow transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Quizzes</CardTitle>
            <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-primary group-hover:animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-primary">{totalQuizzes}</div>
            <p className="text-xs text-muted-foreground mt-1 sm:mt-2">All created quizzes</p>
          </CardContent>
        </Card>
        
        <Card className="futuristic-card hover:neon-glow transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Published</CardTitle>
            <Globe className="h-4 w-4 sm:h-6 sm:w-6 text-green-400 group-hover:animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-green-400">{publishedQuizzes}</div>
            <p className="text-xs text-muted-foreground mt-1 sm:mt-2">Live & accessible</p>
          </CardContent>
        </Card>
        
        <Card className="futuristic-card hover:neon-glow transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Drafts</CardTitle>
            <Lock className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-400 group-hover:animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-yellow-400">{draftQuizzes}</div>
            <p className="text-xs text-muted-foreground mt-1 sm:mt-2">Work in progress</p>
          </CardContent>
        </Card>
        
        <Card className="futuristic-card hover:neon-glow transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Questions</CardTitle>
            <ResultsIcon className="h-4 w-4 sm:h-6 sm:w-6 text-blue-400 group-hover:animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-blue-400">{totalQuestions}</div>
            <p className="text-xs text-muted-foreground mt-1 sm:mt-2">Total questions created</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quizzes by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 touch-target"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <div className="flex gap-2 sm:gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 touch-target">
                  <Filter className="h-4 w-4" />
                  Status
                  {statusFilter !== "all" && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {statusFilter}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  All Quizzes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("published")}>
                  Published Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("draft")}>
                  Drafts Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 touch-target">
                  Sort by {sortBy === "created" ? "Date" : sortBy === "title" ? "Title" : "Questions"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("created")}>
                  Date Created
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("title")}>
                  Title (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("questions")}>
                  Question Count
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {(searchQuery || statusFilter !== "all") && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Showing {filteredAndSortedQuizzes.length} of {totalQuizzes} quizzes</span>
            {(searchQuery || statusFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="h-auto p-1 text-xs hover:text-primary"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
        {filteredAndSortedQuizzes.length === 0 && (searchQuery || statusFilter !== "all") ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Card className="futuristic-card p-8 text-center max-w-md mx-auto">
              <CardContent className="space-y-4">
                <Search className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">No quizzes found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? `No quizzes match "${searchQuery}"` 
                      : `No ${statusFilter} quizzes found`
                    }
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredAndSortedQuizzes.map((quiz) => (
          <Card key={quiz.id} className="futuristic-card flex flex-col hover:neon-glow transition-all duration-300 group min-h-[360px] sm:min-h-[420px] lg:min-h-[440px]">
            <CardHeader className="pb-4 sm:pb-6">
              <div className="flex justify-between items-start gap-3">
                <CardTitle className="pr-2 line-clamp-2 text-lg sm:text-xl font-semibold group-hover:text-primary transition-colors">
                  {quiz.title}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="flex-shrink-0 hover:bg-primary/10 transition-colors rounded-lg h-8 w-8 sm:h-10 sm:w-10">
                      <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="futuristic-card border border-border/40">
                    <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary transition-colors rounded-lg mx-1 my-1 touch-target">
                      <Link href={`/create?edit=${quiz.id}`} className="flex items-center gap-3 p-2">
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary transition-colors rounded-lg mx-1 my-1 touch-target">
                      <Link href={`/results/${quiz.id}`} className="flex items-center gap-3 p-2">
                        <ResultsIcon className="w-4 h-4" />
                        <span>Results</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleTogglePublication(quiz.id, quiz.isPublished || false)}
                      className="hover:bg-primary/10 hover:text-primary transition-colors rounded-lg mx-1 my-1 cursor-pointer touch-target"
                    >
                      <Share2 className="mr-3 h-4 w-4" />
                      <span>{quiz.isPublished ? "Unpublish" : "Publish"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleTogglePublic(quiz.id, quiz.isPublic || false)}
                      className="hover:bg-primary/10 hover:text-primary transition-colors rounded-lg mx-1 my-1 cursor-pointer touch-target"
                    >
                      <Globe className="mr-3 h-4 w-4" />
                      <span>{quiz.isPublic ? "Make Private" : "Make Public"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDuplicateQuiz(quiz)}
                      className="hover:bg-primary/10 hover:text-primary transition-colors rounded-lg mx-1 my-1 cursor-pointer touch-target"
                      disabled={duplicatingQuizId === quiz.id}
                    >
                      <Files className="mr-3 h-4 w-4" />
                      <span>{duplicatingQuizId === quiz.id ? "Duplicating..." : "Duplicate"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleShareQuiz(quiz)}
                      className="hover:bg-primary/10 hover:text-primary transition-colors rounded-lg mx-1 my-1 cursor-pointer touch-target"
                    >
                      <Copy className="mr-3 h-4 w-4" />
                      <span>Share Link</span>
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-destructive hover:bg-destructive/10 transition-colors rounded-lg mx-1 my-1 cursor-pointer touch-target"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash className="mr-3 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="futuristic-card border border-border/40">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the quiz
                            "{quiz.title}" and all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="touch-target">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            disabled={deletingQuizId === quiz.id}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 touch-target"
                          >
                            {deletingQuizId === quiz.id ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription className="line-clamp-2 mt-2 text-sm text-muted-foreground">
                {quiz.description}
              </CardDescription>
              <div className="flex gap-1 sm:gap-2 mt-2 sm:mt-3 flex-wrap">
                <Badge 
                  className={`text-xs px-2 sm:px-3 py-1 ${
                    quiz.isPublished 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  }`}
                >
                  {quiz.isPublished ? (
                    <>
                      <Globe className="mr-1 h-2 w-2 sm:h-3 sm:w-3" />
                      <span className="hidden sm:inline">Published</span>
                      <span className="sm:hidden">Live</span>
                    </>
                  ) : (
                    <>
                      <Lock className="mr-1 h-2 w-2 sm:h-3 sm:w-3" />
                      Draft
                    </>
                  )}
                </Badge>
                <Badge 
                  className={`text-xs px-2 sm:px-3 py-1 ${
                    quiz.isPublic 
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                      : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }`}
                >
                  {quiz.isPublic ? (
                    <>
                      <Globe className="mr-1 h-2 w-2 sm:h-3 sm:w-3" />
                      <span className="hidden sm:inline">Public</span>
                      <span className="sm:hidden">Pub</span>
                    </>
                  ) : (
                    <>
                      <Lock className="mr-1 h-2 w-2 sm:h-3 sm:w-3" />
                      <span className="hidden sm:inline">Private</span>
                      <span className="sm:hidden">Prv</span>
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-grow px-4 sm:px-6">
              <div className="flex items-center text-xs sm:text-sm text-muted-foreground space-x-3 sm:space-x-6">
                <div className="flex items-center gap-1 sm:gap-2">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  <span className="font-medium">{quiz.questions.length}</span>
                  <span className="hidden sm:inline">Questions</span>
                </div>
                {quiz.timeLimit && (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                    <span className="font-medium">{quiz.timeLimit}m</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-1 sm:gap-2 p-3 sm:p-6 pt-2 sm:pt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all duration-200 min-w-0 touch-target"
                asChild
              >
                <Link href={`/results/${quiz.id}`} className="flex items-center justify-center gap-1">
                  <ResultsIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm truncate">Results</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/50 transition-all duration-200 min-w-0 touch-target"
                onClick={() => handleShareQuiz(quiz)}
              >
                <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline text-xs sm:text-sm">Share</span>
              </Button>
              <Button
                size="sm"
                className="flex-1 cyber-button min-w-0 touch-target"
                asChild
              >
                <Link href={`/quiz/${quiz.id}`} className="flex items-center justify-center gap-1">
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm truncate">View</span>
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))
        )}
      </div>

      {/* Share Quiz Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="sm:max-w-md futuristic-card">
          <DialogHeader>
            <DialogTitle>Share Quiz</DialogTitle>
            <DialogDescription>
              Share "{selectedQuiz?.title}" with your students by copying the link below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quiz-link">Quiz Link</Label>
              <div className="flex">
                <Input
                  id="quiz-link"
                  value={selectedQuiz ? getQuizUrl(selectedQuiz.id) : ''}
                  readOnly
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="ml-2"
                  onClick={() => selectedQuiz && copyToClipboard(getQuizUrl(selectedQuiz.id))}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {selectedQuiz && !selectedQuiz.isPublished && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  <Lock className="h-4 w-4 inline mr-1" />
                  This quiz is currently unpublished. Students won't be able to access it until you publish it.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
