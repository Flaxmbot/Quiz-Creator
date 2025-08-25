# PDF Processing Setup

This document explains how to set up PDF processing functionality in the Quiz Creator application.

## Configuration

The application is configured to handle PDF files up to 10MB in size. This is set in the `next.config.js` file with the following configuration:

```javascript
experimental: {
  serverActions: {
    bodySizeLimit: '10mb',
  },
}
```

If you need to adjust this limit, modify the `bodySizeLimit` value in `next.config.js`.

## Performance Optimizations

To improve PDF processing speed, the implementation includes several optimizations:

1. **Size Limiting**: PDF files larger than 5MB are truncated to reduce processing time
2. **Text Limiting**: Only the first 10,000 characters of extracted text are used for title and summary generation
3. **Model Selection**: Uses the `gemini-1.5-flash` model for faster processing
4. **Content Focus**: Instructs the AI to focus on main content and ignore headers, footers, and page numbers

## Implementation Notes

The PDF processing functionality uses the Google Generative AI (Gemini) model to:
1. Extract text content from uploaded PDF files directly
2. Generate a title and summary for the document
3. Create quiz questions based on the document content

The implementation includes:
- A dedicated AI flow for PDF processing (`ai/flows/process-pdf.ts`)
- Server actions for handling PDF upload and processing (`app/actions/quiz.ts`)
- UI components for uploading PDFs and generating quizzes (`components/quiz/quiz-form.tsx`)

## Usage

1. Upload a PDF file using the "Generate Quiz from PDF" section in the quiz creation form (max 10MB)
2. The system will automatically process the PDF and extract its content
3. Configure the quiz settings (question types, number of questions up to 20, difficulty level)
4. Click "Generate Quiz" to create a quiz based on the PDF content

## Troubleshooting

If you encounter issues with PDF processing:

1. Check that your Google Generative AI API key is correctly configured
2. Verify that the PDF file is not corrupted, is in a supported format, and is under 10MB
3. Check the console logs for any error messages
4. Note that very large PDFs may take longer to process

For further assistance, please refer to the main README.md file or contact the development team.