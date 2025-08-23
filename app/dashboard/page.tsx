"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Quiz } from "@/lib/types";
import { FileText, MoreVertical, Clock, Edit, Trash, Share2, Eye, BarChart2 as ResultsIcon } from "lucide-react";
import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { getUserQuizzes } from "@/lib/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [user, loading] = useAuthState(auth);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    async function fetchQuizzes() {
      if (user) {
        setIsDataLoading(true);
        const userQuizzes = await getUserQuizzes(user.uid);
        setQuizzes(userQuizzes);
        setIsDataLoading(false);
      }
    }
    if (!loading) {
      fetchQuizzes();
    }
  }, [user, loading]);

  if (loading || isDataLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
            <CardFooter className="flex gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (!user) {
    return (
        <div className="text-center">
            <p>Please log in to see your quizzes.</p>
        </div>
    )
  }

  if (quizzes.length === 0) {
    return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-semibold">No quizzes yet!</h2>
            <p className="text-muted-foreground mt-2">Get started by creating a new quiz.</p>
            <Button asChild className="mt-4">
                <Link href="/create">Create New Quiz</Link>
            </Button>
        </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {quizzes.map((quiz) => (
        <Card key={quiz.id} className="flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="pr-4">{quiz.title}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ResultsIcon className="mr-2 h-4 w-4" />
                    <Link href={`/results/${quiz.id}`}>Results</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Trash className="mr-2 h-4 w-4" />
                    <span className="text-destructive">Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardDescription className="line-clamp-2">{quiz.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="flex items-center text-sm text-muted-foreground space-x-4">
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-1.5" />
                <span>{quiz.questions.length} Questions</span>
              </div>
              {quiz.timeLimit && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1.5" />
                  <span>{quiz.timeLimit} min</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/quiz/${quiz.id}?preview=true`}>
                <Eye className="mr-2 h-4 w-4" /> Preview
              </Link>
            </Button>
            <Button className="w-full" asChild>
              <Link href={`/quiz/${quiz.id}`}>
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
