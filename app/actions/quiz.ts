'use server';

import { enhanceQuizQuestion } from '@/ai/flows/enhance-quiz-question';
import { generateQuiz, type GenerateQuizInput } from '@/ai/flows/generate-quiz';
import { saveQuiz, updateQuiz } from '@/lib/firestore';
import type { Quiz } from '@/lib/types';
import { handleGenericError } from '@/lib/error-handling';

export async function createQuizAction(quizData: Omit<Quiz, "id" | "authorId" | "createdAt">, userId: string) {
  try {
    if (!userId) {
      return { success: false, error: 'User must be logged in to create a quiz.' };
    }
    if (!quizData.title) {
      return { success: false, error: 'Quiz title cannot be empty.' };
    }
    if (quizData.questions.length === 0) {
      return { success: false, error: 'Please add at least one question.' };
    }

    const quizId = await saveQuiz(quizData, userId);
    return { success: true, data: { quizId } };
  } catch (error) {
    const appError = handleGenericError(error);
    return { success: false, error: appError.message };
  }
}

export async function updateQuizAction(quizId: string, quizData: Partial<Omit<Quiz, "id" | "authorId" | "createdAt">>, userId: string) {
  try {
    if (!userId) {
      return { success: false, error: 'User must be logged in to update a quiz.' };
    }
    if (!quizId) {
      return { success: false, error: 'Quiz ID is missing.' };
    }

    await updateQuiz(quizId, quizData, userId);
    return { success: true, data: { quizId } };
  } catch (error) {
    const appError = handleGenericError(error);
    return { success: false, error: appError.message };
  }
}

export async function enhanceQuestionAction(questionText: string) {
  if (!questionText || typeof questionText !== 'string' || questionText.trim() === '') {
    return { success: false, error: 'Question text cannot be empty.' };
  }

  try {
    const result = await enhanceQuizQuestion({ questionText });
    return { success: true, data: result };
  } catch (error) {
    console.error('AI Enhancement Error:', error);
    return { success: false, error: 'An unexpected error occurred while fetching suggestions.' };
  }
}

export async function generateQuizAction(input: GenerateQuizInput) {
  try {
    // Validate input
    if (!input.topic || input.topic.trim() === '') {
      return { success: false, error: 'Topic cannot be empty.' };
    }

    if (!input.questionTypes || input.questionTypes.length === 0) {
      return { success: false, error: 'At least one question type must be selected.' };
    }

    if (input.numberOfQuestions < 1 || input.numberOfQuestions > 20) {
      return { success: false, error: 'Number of questions must be between 1 and 20.' };
    }

    const result = await generateQuiz(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('AI Quiz Generation Error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, error: 'An unexpected error occurred while generating the quiz.' };
  }
}
