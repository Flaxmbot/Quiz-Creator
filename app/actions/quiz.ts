'use server';

import { enhanceQuizQuestion } from '@/ai/flows/enhance-quiz-question';
import { generateQuiz, type GenerateQuizInput } from '@/ai/flows/generate-quiz';

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
