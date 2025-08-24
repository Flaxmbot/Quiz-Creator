import { StudentQuizView } from "@/components/quiz/student-quiz-view";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";

export default function TakeQuizPage({ params }: { params: { quizId: string } }) {
  // In a real app, you would fetch quiz data from Firestore using params.quizId
  // For now, we'll use a mock quiz object for demonstration.

  if (!params.quizId) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
          <Card className="futuristic-card w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="relative">
                  <AlertCircle className="text-destructive w-6 h-6"/>
                  <div className="absolute inset-0 rounded-full bg-destructive/20 blur-lg -z-10"></div>
                </div>
                <span className="text-xl font-semibold">Quiz Not Found</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No Quiz ID provided. Please use a valid quiz link.</p>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <StudentQuizView quizId={params.quizId} />
    </PageLayout>
  );
}


