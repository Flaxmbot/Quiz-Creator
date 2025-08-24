'use server';

/**
 * @fileOverview This file contains AI functions for enhancing quiz questions using Google AI.
 *
 * - enhanceQuizQuestion - A function that takes a quiz question as input and returns enhanced suggestions for wording and difficulty.
 * - EnhanceQuizQuestionInput - The input type for the enhanceQuizQuestion function.
 * - EnhanceQuizQuestionOutput - The return type for the enhanceQuizQuestion function.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const EnhanceQuizQuestionInputSchema = z.object({
  questionText: z
    .string()
    .describe('The text of the quiz question that needs enhancement.'),
});
export type EnhanceQuizQuestionInput = z.infer<typeof EnhanceQuizQuestionInputSchema>;

const EnhanceQuizQuestionOutputSchema = z.object({
  enhancedWording: z
    .string()
    .describe('Suggested rewording of the question for clarity and engagement.'),
  difficultySuggestion: z
    .string()
    .describe('Suggestions for adjusting the difficulty level of the question.'),
});
export type EnhanceQuizQuestionOutput = z.infer<typeof EnhanceQuizQuestionOutputSchema>;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);

export async function enhanceQuizQuestion(input: EnhanceQuizQuestionInput): Promise<EnhanceQuizQuestionOutput> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `You are an AI assistant designed to help teachers improve their quiz questions.

Given the following quiz question, provide suggestions for enhanced wording and difficulty adjustment.

Question: ${input.questionText}

Consider clarity, engagement, and appropriate difficulty level for students.

Return ONLY valid JSON in this exact format, no additional text:
{
  "enhancedWording": "Improved version of the question text",
  "difficultySuggestion": "Suggestions for adjusting the difficulty level"
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Clean the response to extract JSON
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}') + 1;
    const jsonString = response.slice(jsonStart, jsonEnd);
    
    const parsed = JSON.parse(jsonString);
    
    // Validate the response with our schema
    return EnhanceQuizQuestionOutputSchema.parse(parsed);
  } catch (error) {
    console.error('Error enhancing quiz question:', error);
    throw new Error('Failed to enhance quiz question');
  }
}
