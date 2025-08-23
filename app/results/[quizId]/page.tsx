"use client";

import React, { useEffect, useState } from 'react';
import { getQuiz } from '@/lib/firestore';
import { Quiz, Submission } from '@/lib/types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

function calculateScore(quiz: Quiz, submission: Submission) {
  let score = 0;
  quiz.questions.forEach(question => {
    const correctAnswers = question.correctAnswer;
    const userAnswers = submission.answers[question.id] || [];

    if (question.type === 'multiple-choice') {
      const isCorrect = correctAnswers.length === userAnswers.length && correctAnswers.every(ans => userAnswers.includes(ans));
      if (isCorrect) {
        score += question.points;
      }
    } else if (question.type === 'true-false') {
        const isCorrect = userAnswers.length === 1 && userAnswers[0] === correctAnswers[0];
        if (isCorrect) {
            score += question.points;
        }
    } else if (question.type === 'short-answer') {
        const isCorrect = userAnswers.length === 1 && userAnswers[0].toLowerCase() === correctAnswers[0].toLowerCase();
        if (isCorrect) {
            score += question.points;
        }
    }
  });
  return score;
}

export default function ResultsPage({ params }: { params: { quizId: string } }) {
  const [user, authLoading] = useAuthState(auth);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        setError("You must be logged in to view results.");
        setLoading(false);
        return;
    }

    const fetchResults = async () => {
      try {
        const quizData = await getQuiz(params.quizId);
        if (!quizData) {
          setError("Quiz not found.");
          setLoading(false);
          return;
        }
         if (quizData.authorId !== user.uid) {
          setError("You are not authorized to view these results.");
          setLoading(false);
          return;
        }
        setQuiz(quizData);

        const submissionsQuery = query(collection(db, "submissions"), where("quizId", "==", params.quizId));
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const submissionsData = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
        
        // Calculate scores client-side
        const submissionsWithScores = submissionsData.map(sub => ({
            ...sub,
            score: calculateScore(quizData, sub)
        }))

        setSubmissions(submissionsWithScores);
      } catch (e) {
        console.error(e);
        setError("Failed to load results.");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [params.quizId, user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-4">Loading results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!quiz) {
    return <div className="container mx-auto max-w-4xl py-8">Quiz data not available.</div>;
  }
  
  const totalPossibleScore = quiz.questions.reduce((sum, q) => sum + q.points, 0);
  const averageScore = submissions.length > 0
    ? submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
    : 0;

  const scoreDistribution = submissions.reduce((acc, sub) => {
    const score = sub.score || 0;
    const percentage = totalPossibleScore > 0 ? (score / totalPossibleScore) * 100 : 0;
    if (percentage <= 20) acc['0-20%']++;
    else if (percentage <= 40) acc['21-40%']++;
    else if (percentage <= 60) acc['41-60%']++;
    else if (percentage <= 80) acc['61-80%']++;
    else acc['81-100%']++;
    return acc;
  }, { '0-20%': 0, '21-40%': 0, '41-60%': 0, '61-80%': 0, '81-100%': 0 });

  const chartData = Object.entries(scoreDistribution).map(([name, value]) => ({ name, count: value }));

  return (
    <div className="container mx-auto max-w-6xl py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Results for "{quiz.title}"</h1>
        <p className="text-muted-foreground mt-2">{quiz.description}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{submissions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{averageScore.toFixed(1)} / {totalPossibleScore}</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{quiz.questions.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Number of Students" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className='text-muted-foreground'>No submissions yet to display the distribution.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
