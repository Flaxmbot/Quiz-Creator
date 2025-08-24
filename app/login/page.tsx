import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm sm:max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-center">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-2 text-center">
            Sign in to continue to your dashboard.
          </p>
        </div>
        <AuthForm type="login" />
      </div>
    </div>
  );
}
