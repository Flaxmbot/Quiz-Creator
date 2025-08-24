import { Suspense } from "react";
import { QuizForm } from "@/components/quiz/quiz-form";
import { PageLayout } from "@/components/layout/page-layout";

function QuizFormSkeleton() {
  return (
    <div className="space-y-8">
      <div className="p-6 border rounded-lg bg-card">
        <div className="space-y-4">
          <div className="h-6 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-10 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

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
        <Suspense fallback={<QuizFormSkeleton />}>
          <QuizForm />
        </Suspense>
      </div>
    </PageLayout>
  );
}
