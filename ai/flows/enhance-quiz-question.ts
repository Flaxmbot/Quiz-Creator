'use server';

/**
 * @fileOverview This file contains a Genkit flow for enhancing quiz questions using AI.
 *
 * - enhanceQuizQuestion - A function that takes a quiz question as input and returns enhanced suggestions for wording and difficulty.
 * - EnhanceQuizQuestionInput - The input type for the enhanceQuizQuestion function.
 * - EnhanceQuizQuestionOutput - The return type for the enhanceQuizQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

export async function enhanceQuizQuestion(input: EnhanceQuizQuestionInput): Promise<EnhanceQuizQuestionOutput> {
  return enhanceQuizQuestionFlow(input);
}

const enhanceQuizQuestionPrompt = ai.definePrompt({
  name: 'enhanceQuizQuestionPrompt',
  input: {schema: EnhanceQuizQuestionInputSchema},
  output: {schema: EnhanceQuizQuestionOutputSchema},
  prompt: `You are an AI assistant designed to help teachers improve their quiz questions.

  Given the following quiz question, provide suggestions for enhanced wording and difficulty adjustment.

  Question: {{{questionText}}}

  Consider clarity, engagement, and appropriate difficulty level for students.

  Format your response with enhancedWording and difficultySuggestion fields.`,
});

const enhanceQuizQuestionFlow = ai.defineFlow(
  {
    name: 'enhanceQuizQuestionFlow',
    inputSchema: EnhanceQuizQuestionInputSchema,
    outputSchema: EnhanceQuizQuestionOutputSchema,
  },
  async input => {
    const {output} = await enhanceQuizQuestionPrompt(input);
    return output!;
  }
);
