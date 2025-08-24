"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Quiz } from "@/lib/types";
import { FileText, MoreVertical, Clock, Edit, Trash, Share2, Eye, BarChart2 as ResultsIcon, Globe, Lock, PlusCircle, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { getUserQuizzes, deleteQuiz, toggleQuizPublication, toggleQuizPublic } from "@/lib/firestore";
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
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const fetchQuizzes = async () => {
    if (user) {
      setIsDataLoading(true);
      try {
        const userQuizzes = await getUserQuizzes(user.uid);
        setQuizzes(userQuizzes);
      } catch (error) {
        const appError = handleGenericError(error);
        toast({
          variant: "destructive",
          title: "Error Loading Quizzes",
          description: appError.message,
        });
      } finally {
        setIsDataLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchQuizzes();
    }
  }, [user, loading]);

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
            <p className="text-muted-foreground">Please log in to access your quizzes.</p>
          </CardContent>
        </Card>
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

  const totalQuizzes = quizzes.length;
  const publishedQuizzes = quizzes.filter(q => q.isPublished).length;
  const draftQuizzes = totalQuizzes - publishedQuizzes;
  const totalQuestions = quizzes.reduce((acc, q) => acc + q.questions.length, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-lg mt-2">Manage your quizzes and track performance</p>
        </div>
        <Button asChild className="cyber-button">
          <Link href="/create">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Quiz
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="futuristic-card hover:neon-glow transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Quizzes</CardTitle>
            <FileText className="h-6 w-6 text-primary group-hover:animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalQuizzes}</div>
            <p className="text-xs text-muted-foreground mt-2">All created quizzes</p>
          </CardContent>
        </Card>
        
        <Card className="futuristic-card hover:neon-glow transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
            <Globe className="h-6 w-6 text-green-400 group-hover:animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{publishedQuizzes}</div>
            <p className="text-xs text-muted-foreground mt-2">Live & accessible</p>
          </CardContent>
        </Card>
        
        <Card className="futuristic-card hover:neon-glow transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
            <Lock className="h-6 w-6 text-yellow-400 group-hover:animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">{draftQuizzes}</div>
            <p className="text-xs text-muted-foreground mt-2">Work in progress</p>
          </CardContent>
        </Card>
        
        <Card className="futuristic-card hover:neon-glow transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Questions</CardTitle>
            <ResultsIcon className="h-6 w-6 text-blue-400 group-hover:animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">{totalQuestions}</div>
            <p className="text-xs text-muted-foreground mt-2">Total questions created</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="futuristic-card flex flex-col hover:neon-glow transition-all duration-300 group">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="pr-4 line-clamp-2 text-lg font-semibold group-hover:text-primary transition-colors">
                  {quiz.title}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="flex-shrink-0 hover:bg-primary/10 transition-colors rounded-lg">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="futuristic-card border border-border/40">
                    <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary transition-colors rounded-lg mx-1 my-1">
                      <Link href={`/create?edit=${quiz.id}`} className="flex items-center gap-3 p-2">
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary transition-colors rounded-lg mx-1 my-1">
                      <Link href={`/results/${quiz.id}`} className="flex items-center gap-3 p-2">
                        <ResultsIcon className="w-4 h-4" />
                        <span>Results</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleTogglePublication(quiz.id, quiz.isPublished || false)}
                      className="hover:bg-primary/10 hover:text-primary transition-colors rounded-lg mx-1 my-1 cursor-pointer"
                    >
                      <Share2 className="mr-3 h-4 w-4" />
                      <span>{quiz.isPublished ? "Unpublish" : "Publish"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleTogglePublic(quiz.id, quiz.isPublic || false)}
                      className="hover:bg-primary/10 hover:text-primary transition-colors rounded-lg mx-1 my-1 cursor-pointer"
                    >
                      <Globe className="mr-3 h-4 w-4" />
                      <span>{quiz.isPublic ? "Make Private" : "Make Public"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleShareQuiz(quiz)}
                      className="hover:bg-primary/10 hover:text-primary transition-colors rounded-lg mx-1 my-1 cursor-pointer"
                    >
                      <Copy className="mr-3 h-4 w-4" />
                      <span>Share Link</span>
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-destructive hover:bg-destructive/10 transition-colors rounded-lg mx-1 my-1 cursor-pointer"
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
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            disabled={deletingQuizId === quiz.id}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deletingQuizId === quiz.id ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription className="line-clamp-2 mt-2 text-muted-foreground">
                {quiz.description}
              </CardDescription>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Badge 
                  className={`text-xs px-3 py-1 ${
                    quiz.isPublished 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  }`}
                >
                  {quiz.isPublished ? (
                    <>
                      <Globe className="mr-1 h-3 w-3" />
                      Published
                    </>
                  ) : (
                    <>
                      <Lock className="mr-1 h-3 w-3" />
                      Draft
                    </>
                  )}
                </Badge>
                <Badge 
                  className={`text-xs px-3 py-1 ${
                    quiz.isPublic 
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                      : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }`}
                >
                  {quiz.isPublic ? (
                    <>
                      <Globe className="mr-1 h-3 w-3" />
                      Public
                    </>
                  ) : (
                    <>
                      <Lock className="mr-1 h-3 w-3" />
                      Private
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-center text-sm text-muted-foreground space-x-6">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium">{quiz.questions.length} Questions</span>
                </div>
                {quiz.timeLimit && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span className="font-medium">{quiz.timeLimit} min</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2 p-6 pt-4">
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all duration-200" 
                asChild
              >
                <Link href={`/results/${quiz.id}`} className="flex items-center justify-center gap-2">
                  <ResultsIcon className="h-4 w-4" /> 
                  <span>Results</span>
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/50 transition-all duration-200"
                onClick={() => handleShareQuiz(quiz)}
              >
                <Share2 className="h-4 w-4" /> 
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button 
                size="sm"
                className="flex-1 cyber-button" 
                asChild
              >
                <Link href={`/quiz/${quiz.id}`} className="flex items-center justify-center gap-2">
                  <Eye className="h-4 w-4" /> 
                  <span>View</span>
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
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
