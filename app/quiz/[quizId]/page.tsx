import { StudentQuizView } from "@/components/quiz/student-quiz-view";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function TakeQuizPage({ params }: { params: { quizId: string } }) {
  // In a real app, you would fetch quiz data from Firestore using params.quizId
  // For now, we'll use a mock quiz object for demonstration.

  if (!params.quizId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="text-destructive"/>
              Error
              </CardTitle>
          </CardHeader>
          <CardContent>
            <p>No Quiz ID provided. Please use a valid quiz link.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <StudentQuizView quizId={params.quizId} />;
}
