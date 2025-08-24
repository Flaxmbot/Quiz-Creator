import { Suspense } from "react";
import { QuizForm } from "@/components/quiz/quiz-form";
import { PageLayout } from "@/components/layout/page-layout";
import { RoleGuard } from "@/components/auth/role-guard";

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
      <RoleGuard 
        allowedRoles={['teacher']} 
        fallbackMessage="Only teachers can create quizzes. Students can take quizzes from their dashboard."
      >
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
          <div className="text-center space-y-3 sm:space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              Create a New Quiz
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg lg:text-xl max-w-xs sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto">
              Fill in the details below and add your questions. Use the AI assistant to enhance your questions!
            </p>
          </div>
          <Suspense fallback={<QuizFormSkeleton />}>
            <QuizForm />
          </Suspense>
        </div>
      </RoleGuard>
    </PageLayout>
  );
}
