'use server';

/**
 * @fileOverview This file contains a Genkit flow for generating complete quizzes using AI.
 *
 * - generateQuiz - A function that takes quiz parameters and returns a complete quiz with questions.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizInputSchema = z.object({
  topic: z
    .string()
    .describe('The main topic or subject for the quiz.'),
  questionTypes: z
    .array(z.enum(['multiple-choice', 'true-false', 'short-answer', 'fill-in-the-blank']))
    .describe('Array of question types to include in the quiz.'),
  numberOfQuestions: z
    .number()
    .min(1)
    .max(20)
    .describe('Number of questions to generate (1-20).'),
  difficultyLevel: z
    .enum(['easy', 'medium', 'hard'])
    .describe('Difficulty level of the quiz.'),
  additionalInstructions: z
    .string()
    .optional()
    .describe('Additional instructions or context for quiz generation.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const QuestionSchema = z.object({
  text: z.string().describe('The question text.'),
  type: z.enum(['multiple-choice', 'true-false', 'short-answer', 'fill-in-the-blank']).describe('Question type.'),
  options: z.array(z.object({
    text: z.string().describe('Option text.'),
  })).optional().describe('Options for multiple-choice and true-false questions.'),
  correctAnswer: z.array(z.string()).describe('Correct answer(s). For multiple-choice: option indices (0,1,2...). For true-false: "0" for first option, "1" for second. For text answers: the correct text.'),
  points: z.number().describe('Points for this question.'),
});

const GenerateQuizOutputSchema = z.object({
  title: z.string().describe('Generated quiz title.'),
  description: z.string().describe('Generated quiz description.'),
  questions: z.array(QuestionSchema).describe('Array of generated questions.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const generateQuizPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `You are an AI assistant designed to help teachers create comprehensive quizzes.

  Generate a complete quiz based on the following parameters:
  - Topic: {{{topic}}}
  - Question Types: {{{questionTypes}}}
  - Number of Questions: {{{numberOfQuestions}}}
  - Difficulty Level: {{{difficultyLevel}}}
  {{#if additionalInstructions}}
  - Additional Instructions: {{{additionalInstructions}}}
  {{/if}}

  Guidelines:
  1. Create a relevant title and description for the quiz
  2. Generate exactly {{{numberOfQuestions}}} questions
  3. Distribute question types as evenly as possible based on the requested types
  4. For multiple-choice questions: provide 4 options, use correctAnswer as array of indices (e.g., ["0"] for first option, ["0","2"] for multiple correct)
  5. For true-false questions: provide exactly 2 options ["True", "False"], use correctAnswer as ["0"] for True or ["1"] for False
  6. For short-answer and fill-in-the-blank: leave options empty, use correctAnswer as array with the correct text answer
  7. Assign appropriate points (typically 10 points per question, but can vary based on difficulty)
  8. Ensure questions are appropriate for the specified difficulty level
  9. Make questions clear, engaging, and educational

  Return the quiz in the specified JSON format.`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const {output} = await generateQuizPrompt(input);
    return output!;
  }
);
