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
  createdAt: Timestamp;
}

export interface Submission {
    id: string;
    quizId: string;
    studentId?: string; // Optional if you allow anonymous submissions
    answers: Record<string, string[]>; // questionId -> array of selected optionIds or text answer
    submittedAt: Timestamp;
    score?: number;
}
