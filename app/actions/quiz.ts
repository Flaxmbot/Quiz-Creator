'use server';

import { enhanceQuizQuestion } from '@/ai/flows/enhance-quiz-question';
import { generateQuiz, type GenerateQuizInput } from '@/ai/flows/generate-quiz';
import { processPdf, generateQuizFromPdf, type ProcessPdfInput, type GenerateQuizFromPdfInput } from '@/ai/flows/process-pdf';
import { saveQuiz, updateQuiz, getUserProfile } from '@/lib/firestore';
import type { Quiz } from '@/lib/types';
import { handleGenericError } from '@/lib/error-handling';

export async function createQuizAction(quizData: Omit<Quiz, "id" | "authorId" | "createdAt">, userId: string) {
  try {
    if (!userId) {
      return { success: false, error: 'User must be logged in to create a quiz.' };
    }
    
    // Check if user has teacher role
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return { success: false, error: 'User profile not found. Please refresh the page and try again.' };
    }
    
    if (userProfile.role !== 'teacher') {
      return { success: false, error: 'Only teachers can create quizzes. Students can take quizzes from the dashboard.' };
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

    // Check if user has teacher role
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return { success: false, error: 'User profile not found. Please refresh the page and try again.' };
    }
    
    if (userProfile.role !== 'teacher') {
      return { success: false, error: 'Only teachers can update quizzes.' };
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

export async function processPdfAction(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      return { success: false, error: 'No file provided.' };
    }
    
    if (file.type !== 'application/pdf') {
      return { success: false, error: 'Only PDF files are supported.' };
    }
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File size exceeds 10MB limit.' };
    }
    
    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Process the PDF
    const result = await processPdf({
      pdfBuffer: buffer,
      filename: file.name
    });
    
    return { success: true, data: result };
  } catch (error: any) {
    console.error('PDF Processing Error:', error);
    
    // Handle specific error cases
    if (error.message && error.message.includes('Body exceeded')) {
      return { success: false, error: 'File size exceeds server limit. Please upload a smaller PDF file.' };
    }
    
    if (error.message && error.message.includes('pdf-parse')) {
      return { success: false, error: 'PDF processing library not installed. Please install pdf-parse dependency by running: npm install pdf-parse' };
    }
    
    if (error.message && error.message.includes('No text content found')) {
      return { success: false, error: 'No text content found in the PDF document. Please check the file and try again.' };
    }
    
    return { success: false, error: 'An unexpected error occurred while processing the PDF.' };
  }
}

export async function generateQuizFromPdfAction(input: GenerateQuizFromPdfInput) {
  try {
    // Validate input
    if (!input.textContent || input.textContent.trim() === '') {
      return { success: false, error: 'Document content cannot be empty.' };
    }

    if (!input.questionTypes || input.questionTypes.length === 0) {
      return { success: false, error: 'At least one question type must be selected.' };
    }

    if (input.numberOfQuestions < 1 || input.numberOfQuestions > 20) {
      return { success: false, error: 'Number of questions must be between 1 and 20.' };
    }

    const result = await generateQuizFromPdf(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('AI Quiz Generation from PDF Error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, error: 'An unexpected error occurred while generating the quiz from PDF content.' };
  }
}
