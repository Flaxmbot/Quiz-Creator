import { QuizForm } from "@/components/quiz/quiz-form";

export default function CreateQuizPage() {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Create a New Quiz</h1>
        <p className="text-muted-foreground mt-2">
          Fill in the details below and add your questions. Use the AI assistant to enhance your questions!
        </p>
      </div>
      <QuizForm />
    </div>
  );
}
