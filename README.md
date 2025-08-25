# Quiz Creator

A web application for creating and sharing quizzes, built with Next.js, Firebase, and Google Gemini.

## Features

*   **Create Quizzes:** Easily create quizzes with multiple-choice questions.
*   **AI-Powered Generation:** Leverage the power of Google Gemini to automatically generate quizzes from a topic.
*   **PDF Processing:** Upload PDF documents and automatically generate quizzes from their content.
*   **User Authentication:** Secure user authentication and authorization provided by Firebase.
*   **Dashboard:** A personal dashboard to manage, track, and view your quizzes.
*   **Publish and Share:** Publish your quizzes to share them with students or friends.
*   **Profile Management:** Update your profile information and manage your account.

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or later)
*   [npm](https://www.npmjs.com/)
*   A [Firebase](https://firebase.google.com/) project
*   A [Google AI](https://ai.google.dev/) API key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd Quiz-Creator
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project and add your Firebase and Google AI credentials. You can use the `.env.example` file as a template.

### Running the Application

To start the development server, run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Technologies Used

*   **Framework:** [Next.js](https://nextjs.org/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [Shadcn/ui](https://ui.shadcn.com/)
*   **Backend:** [Firebase](https://firebase.google.com/) (Authentication, Firestore)
*   **AI:** [Google Gemini](https://ai.google.dev/)

## PDF Processing

The application now supports generating quizzes from PDF documents. This feature allows teachers to upload educational materials and automatically create quizzes based on the content.

Key features:
- Supports PDF files up to 10MB in size
- Extracts text content from PDFs using Google Gemini AI
- Generates relevant quiz questions using AI
- Configurable question types, number, and difficulty
- Performance optimized for faster processing

To use this feature:
1. Navigate to the quiz creation page
2. Select the "Generate Quiz from PDF" option
3. Upload a PDF document (max 10MB)
4. Configure quiz settings (question types, number of questions up to 20, difficulty)
5. Generate the quiz

For detailed setup instructions and performance optimizations, see [PDF_PROCESSING_SETUP.md](PDF_PROCESSING_SETUP.md).

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.
