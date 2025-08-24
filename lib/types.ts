import type { Timestamp } from "firebase/firestore";

export type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer' | 'fill-in-the-blank';

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: Option[];
  correctAnswer: string[];
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  timeLimit?: number;
  password?: string;
  authorId: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  isPublished?: boolean;
  isPublic?: boolean;
  submissionCount?: number;
  allowRetakes?: boolean;
  showCorrectAnswers?: boolean;
  randomizeQuestions?: boolean;
  category?: string;
  tags?: string[];
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  answers: Record<string, string[]>; // questionId -> array of selected optionIds or text answer
  submittedAt: Date | Timestamp;
  score?: number;
  totalPoints?: number;
  timeSpent?: number; // in seconds
  isCompleted: boolean;
}

export interface Submission {
    id: string;
    quizId: string;
    studentId?: string; // Optional if you allow anonymous submissions
    answers: Record<string, string[]>; // questionId -> array of selected optionIds or text answer
    submittedAt: Timestamp;
    score?: number;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'teacher' | 'student';
  createdAt: Date | Timestamp;
  lastLoginAt?: Date | Timestamp;
}

export interface QuizAnalytics {
  quizId: string;
  totalSubmissions: number;
  averageScore: number;
  completionRate: number;
  averageTimeSpent: number;
  questionAnalytics: QuestionAnalytics[];
}

export interface QuestionAnalytics {
  questionId: string;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers: number;
  averageTimeSpent: number;
  difficultyLevel: 'easy' | 'medium' | 'hard';
}
