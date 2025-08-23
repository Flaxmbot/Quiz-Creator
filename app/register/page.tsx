import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-center">
            Create an Account
          </h1>
          <p className="text-muted-foreground mt-2 text-center">
            Get started with QuizLink by creating your account.
          </p>
        </div>
        <AuthForm type="register" />
      </div>
    </div>
  );
}
