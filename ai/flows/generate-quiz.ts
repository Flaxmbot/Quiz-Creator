'use server';

/**
 * @fileOverview This file contains AI functions for generating complete quizzes using Google AI.
 *
 * - generateQuiz - A function that takes quiz parameters and returns a complete quiz with questions.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

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

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `You are an AI assistant designed to help teachers create comprehensive quizzes.

Generate a complete quiz based on the following parameters:
- Topic: ${input.topic}
- Question Types: ${input.questionTypes.join(', ')}
- Number of Questions: ${input.numberOfQuestions}
- Difficulty Level: ${input.difficultyLevel}
${input.additionalInstructions ? `- Additional Instructions: ${input.additionalInstructions}` : ''}

Guidelines:
1. Create a relevant title and description for the quiz
2. Generate exactly ${input.numberOfQuestions} questions
3. Distribute question types as evenly as possible based on the requested types
4. For multiple-choice questions: provide 4 options, use correctAnswer as array of indices (e.g., ["0"] for first option, ["0","2"] for multiple correct)
5. For true-false questions: provide exactly 2 options ["True", "False"], use correctAnswer as ["0"] for True or ["1"] for False
6. For short-answer and fill-in-the-blank: leave options empty, use correctAnswer as array with the correct text answer
7. Assign appropriate points (typically 10 points per question, but can vary based on difficulty)
8. Ensure questions are appropriate for the specified difficulty level
9. Make questions clear, engaging, and educational

Return ONLY valid JSON in this exact format, no additional text:
{
  "title": "Quiz Title",
  "description": "Quiz Description", 
  "questions": [
    {
      "text": "Question text",
      "type": "multiple-choice",
      "options": [
        {"text": "Option A"},
        {"text": "Option B"},
        {"text": "Option C"},
        {"text": "Option D"}
      ],
      "correctAnswer": ["0"],
      "points": 10
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Clean the response to extract JSON
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}') + 1;
    const jsonString = response.slice(jsonStart, jsonEnd);
    
    const parsed = JSON.parse(jsonString);
    
    // Validate the response with our schema
    return GenerateQuizOutputSchema.parse(parsed);
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw new Error('Failed to generate quiz');
  }
}