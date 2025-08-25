'use server';

/**
 * @fileOverview This file contains AI functions for processing PDF documents using an unstructured data toolkit.
 *
 * - processPdf - A function that takes a PDF buffer and returns extracted text content.
 * - generateQuizFromPdf - A function that takes a PDF buffer and generates quiz questions.
 * - ProcessPdfInput - The input type for the processPdf function.
 * - ProcessPdfOutput - The return type for the processPdf function.
 * - GenerateQuizFromPdfInput - The input type for the generateQuizFromPdf function.
 * - GenerateQuizFromPdfOutput - The return type for the generateQuizFromPdf function.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const ProcessPdfInputSchema = z.object({
  pdfBuffer: z.instanceof(Buffer).describe('The PDF file buffer to process.'),
  filename: z.string().describe('The name of the PDF file.'),
});
export type ProcessPdfInput = z.infer<typeof ProcessPdfInputSchema>;

const ProcessPdfOutputSchema = z.object({
  textContent: z.string().describe('The extracted text content from the PDF.'),
  title: z.string().describe('The title of the document.'),
  summary: z.string().describe('A summary of the document content.'),
});
export type ProcessPdfOutput = z.infer<typeof ProcessPdfOutputSchema>;

const GenerateQuizFromPdfInputSchema = z.object({
  textContent: z.string().describe('The extracted text content from the PDF.'),
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
});
export type GenerateQuizFromPdfInput = z.infer<typeof GenerateQuizFromPdfInputSchema>;

const QuestionSchema = z.object({
  text: z.string().describe('The question text.'),
  type: z.enum(['multiple-choice', 'true-false', 'short-answer', 'fill-in-the-blank']).describe('Question type.'),
  options: z.array(z.object({
    text: z.string().describe('Option text.'),
  })).optional().describe('Options for multiple-choice and true-false questions.'),
  correctAnswer: z.array(z.string()).describe('Correct answer(s). For multiple-choice: option indices (0,1,2...). For true-false: "0" for first option, "1" for second. For text answers: the correct text.'),
  points: z.number().describe('Points for this question.'),
});

const GenerateQuizFromPdfOutputSchema = z.object({
  title: z.string().describe('Generated quiz title based on document content.'),
  description: z.string().describe('Generated quiz description based on document content.'),
  questions: z.array(QuestionSchema).describe('Array of generated questions.'),
});
export type GenerateQuizFromPdfOutput = z.infer<typeof GenerateQuizFromPdfOutputSchema>;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);

export async function processPdf(input: ProcessPdfInput): Promise<ProcessPdfOutput> {
  try {
    // Use a faster model for initial text extraction
    const extractionModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Send the PDF directly to Gemini for processing
    // Limit the PDF size to improve performance
    const maxPdfSize = 10 * 1024 * 1024; // 10MB
    const pdfBuffer = input.pdfBuffer.length > maxPdfSize
      ? input.pdfBuffer.subarray(0, maxPdfSize)
      : input.pdfBuffer;
    
    const result = await extractionModel.generateContent([
      {
        text: 'Extract the text content from the following PDF document. Focus on the main content and ignore headers, footers, and page numbers. Provide only the text content, nothing else.'
      },
      {
        inlineData: {
          data: pdfBuffer.toString('base64'),
          mimeType: 'application/pdf'
        }
      }
    ]);
    
    const textContent = result.response.text().trim();
    
    // Check if we extracted any text
    if (!textContent || textContent.trim().length === 0) {
      throw new Error('No text content found in the PDF document.');
    }
    
    // Use a faster model for title and summary generation
    const processingModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Limit the text content for title and summary generation to improve performance
    const maxTextLength = 20000;
    const limitedTextContent = textContent.length > maxTextLength
      ? textContent.substring(0, maxTextLength) + '...'
      : textContent;
    
    // Generate a title for the document
    const titlePrompt = `Based on the following document content, generate a concise and relevant title (max 10 words):

${limitedTextContent}

Return ONLY the title, no additional text.`;
    
    const titleResult = await processingModel.generateContent(titlePrompt);
    const title = titleResult.response.text().trim();
    
    // Generate a summary of the document
    const summaryPrompt = `Provide a concise summary (2-3 sentences) of the following document content:

${limitedTextContent}

Return ONLY the summary, no additional text.`;
    
    const summaryResult = await processingModel.generateContent(summaryPrompt);
    const summary = summaryResult.response.text().trim();
    
    return ProcessPdfOutputSchema.parse({
      textContent: limitedTextContent,
      title,
      summary
    });
  } catch (error: any) {
    console.error('Error processing PDF:', error);
    throw new Error(`Failed to process PDF document: ${error.message || 'Unknown error'}`);
  }
}

export async function generateQuizFromPdf(input: GenerateQuizFromPdfInput): Promise<GenerateQuizFromPdfOutput> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `You are an AI assistant designed to help teachers create comprehensive quizzes from educational content.

Generate a complete quiz based on the following document content:
${input.textContent.substring(0, 8000)}...

Quiz Parameters:
- Question Types: ${input.questionTypes.join(', ')}
- Number of Questions: ${input.numberOfQuestions}
- Difficulty Level: ${input.difficultyLevel}

Guidelines:
1. Create a relevant title and description for the quiz based on the document content
2. Generate exactly ${input.numberOfQuestions} questions
3. Distribute question types as evenly as possible based on the requested types
4. For multiple-choice questions: provide 4 options, use correctAnswer as array of indices (e.g., ["0"] for first option, ["0","2"] for multiple correct)
5. For true-false questions: provide exactly 2 options ["True", "False"], use correctAnswer as ["0"] for True or ["1"] for False
6. For short-answer and fill-in-the-blank: leave options empty, use correctAnswer as array with the correct text answer
7. Assign appropriate points (typically 10 points per question, but can vary based on difficulty)
8. Ensure questions are appropriate for the specified difficulty level
9. Make questions clear, engaging, and educational
10. Focus on key concepts and important information from the document

Return ONLY valid JSON in this exact format, no additional text:
{
  "title": "Quiz Title Based on Document Content",
  "description": "Quiz Description Based on Document Content", 
  "questions": [
    {
      "text": "Question text based on document content",
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
    return GenerateQuizFromPdfOutputSchema.parse(parsed);
  } catch (error) {
    console.error('Error generating quiz from PDF:', error);
    throw new Error('Failed to generate quiz from PDF content');
  }
}