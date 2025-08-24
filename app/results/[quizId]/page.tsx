'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getQuiz, getQuizResults } from '@/lib/firestore';
import type { Quiz, QuizSubmission } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { handleGenericError } from '@/lib/error-handling';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Trophy, Users, TrendingUp, Award, Clock, Target, Star, Zap, Share2, Copy, Check } from 'lucide-react';
import { PageLayout } from '@/components/layout/page-layout';

export default function ResultsPage() {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [results, setResults] = useState<QuizSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchQuizData = async () => {
      if (typeof quizId !== 'string') return;

      try {
        const [quizData, resultsData] = await Promise.all([
          getQuiz(quizId),
          getQuizResults(quizId),
        ]);
        setQuiz(quizData);
        setResults(resultsData);
      } catch (error) {
        const appError = handleGenericError(error);
        toast({
          variant: 'destructive',
          title: 'Error loading results',
          description: appError.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId, toast]);

  const shareQuizResults = async () => {
    const resultsUrl = `${window.location.origin}/results/${quizId}`;
    try {
      await navigator.clipboard.writeText(resultsUrl);
      setCopied(true);
      toast({
        title: "Results Link Copied!",
        description: "Quiz results link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive", 
        title: "Copy Failed",
        description: "Failed to copy results link to clipboard.",
      });
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="space-y-8 animate-pulse">
          <Skeleton className="h-12 w-80 rounded-xl" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </PageLayout>
    );
  }

  if (!quiz) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="futuristic-card p-8 text-center">
            <CardContent>
              <h2 className="text-2xl font-bold text-muted-foreground mb-2">Quiz Not Found</h2>
              <p className="text-muted-foreground">The quiz you're looking for doesn't exist or has been removed.</p>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const averageScore = results.length > 0
    ? results.reduce((acc, r) => acc + r.score, 0) / results.length
    : 0;
    
  const maxScore = results.length > 0 ? Math.max(...results.map(r => r.score)) : 0;
  const minScore = results.length > 0 ? Math.min(...results.map(r => r.score)) : 0;
  
  const passRate = results.length > 0 
    ? (results.filter(r => r.score >= 70).length / results.length) * 100 
    : 0;

  const scoreDistribution = results.reduce((acc, r) => {
    const scoreBand = Math.floor(r.score / 10) * 10;
    const band = `${scoreBand}-${scoreBand + 9}%`;
    acc[band] = (acc[band] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(scoreDistribution)
    .map(([name, count]) => ({ name, count, percentage: (count / results.length) * 100 }))
    .sort((a, b) => parseInt(a.name) - parseInt(b.name));
    
  const pieData = [
    { name: 'Excellent (90-100%)', value: results.filter(r => r.score >= 90).length, color: '#10B981' },
    { name: 'Good (80-89%)', value: results.filter(r => r.score >= 80 && r.score < 90).length, color: '#3B82F6' },
    { name: 'Average (70-79%)', value: results.filter(r => r.score >= 70 && r.score < 80).length, color: '#F59E0B' },
    { name: 'Below Average (<70%)', value: results.filter(r => r.score < 70).length, color: '#EF4444' }
  ].filter(item => item.value > 0);
  
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

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
        {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">
          {quiz.title}
        </h1>
        <p className="text-xl text-muted-foreground">Quiz Results & Analytics</p>
        <div className="flex justify-center items-center gap-4">
          <Badge variant="outline" className="px-6 py-2 text-lg bg-primary/10 border-primary/30">
            <Target className="w-5 h-5 mr-2" />
            {results.length} Participants
          </Badge>
          <button 
            onClick={shareQuizResults}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg transition-all duration-200"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? "Copied!" : "Share Results"}
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="futuristic-card hover:neon-glow transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Participants</CardTitle>
            <Users className="h-6 w-6 text-primary group-hover:animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{results.length}</div>
            <p className="text-xs text-muted-foreground mt-2">Active participants</p>
          </CardContent>
        </Card>

        <Card className="futuristic-card hover:neon-glow transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
            <TrendingUp className="h-6 w-6 text-blue-400 group-hover:animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(averageScore)}`}>
              {averageScore.toFixed(1)}%
            </div>
            <Progress value={averageScore} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="futuristic-card hover:neon-glow transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pass Rate</CardTitle>
            <Award className="h-6 w-6 text-green-400 group-hover:animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{passRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-2">Scored ≥70%</p>
          </CardContent>
        </Card>

        <Card className="futuristic-card hover:neon-glow transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Score</CardTitle>
            <Zap className="h-6 w-6 text-yellow-400 group-hover:animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">{maxScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-2">Best performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Score Distribution Bar Chart */}
        <Card className="futuristic-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <BarChart className="w-6 h-6 text-primary" />
              Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 69, 255, 0.1)" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="url(#barGradient)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Overview Pie Chart */}
        <Card className="futuristic-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Target className="w-6 h-6 text-primary" />
              Performance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage?.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  className="text-xs"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card className="futuristic-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.sort((a, b) => b.score - a.score).slice(0, 10).map((result, index) => (
              <div key={result.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors duration-200 border border-border/20">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/30' :
                    index === 1 ? 'bg-gray-500/20 text-gray-400 border-2 border-gray-500/30' :
                    index === 2 ? 'bg-amber-600/20 text-amber-400 border-2 border-amber-600/30' :
                    'bg-primary/20 text-primary border border-primary/30'
                  }`}>
                    {index === 0 && <Trophy className="w-5 h-5" />}
                    {index === 1 && <Award className="w-5 h-5" />}
                    {index === 2 && <Star className="w-5 h-5" />}
                    {index > 2 && (index + 1)}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{result.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      Submitted {new Date(result.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={`text-lg px-4 py-2 ${getScoreBadgeColor(result.score)}`}>
                    {result.score.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Participants */}
      {results.length > 10 && (
        <Card className="futuristic-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Users className="w-6 h-6 text-primary" />
              All Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {results.sort((a, b) => b.score - a.score).map((result, index) => (
                <div key={result.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-8">#{index + 1}</span>
                    <div>
                      <p className="font-medium">{result.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(result.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={getScoreBadgeColor(result.score)}>
                    {result.score.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </PageLayout>
  );
}