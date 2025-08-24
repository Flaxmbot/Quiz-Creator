import { QuizForm } from "@/components/quiz/quiz-form";
import { PageLayout } from "@/components/layout/page-layout";

export default function CreateQuizPage() {
  return (
    <PageLayout>
      <div className="container mx-auto max-w-6xl py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            Create a New Quiz
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Fill in the details below and add your questions. Use the AI assistant to enhance your questions!
          </p>
        </div>
        <QuizForm />
      </div>
    </PageLayout>
  );
}
