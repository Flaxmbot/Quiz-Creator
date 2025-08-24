
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { auth } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { handleGenericError } from "@/lib/error-handling";

interface AuthFormProps {
  type: "login" | "register";
}

const GoogleIcon = () => (
    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
    </svg>
)

export function AuthForm({ type }: AuthFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [userType, setUserType] = useState("teacher");
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<"google" | "email">("google");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
  });

  const title = type === "login" ? "Sign In" : "Sign Up";
  const description =
    type === "login"
      ? `Sign in with Google to access your ${userType} account.`
      : `Sign up with Google to create your ${userType} account.`;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateForm = () => {
    if (authMethod === "email") {
      if (!formData.email || !formData.password) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Email and password are required.",
        });
        return false;
      }

      if (type === "register") {
        if (!formData.displayName) {
          toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Display name is required for registration.",
          });
          return false;
        }

        if (formData.password !== formData.confirmPassword) {
          toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Passwords do not match.",
          });
          return false;
        }

        if (formData.password.length < 6) {
          toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Password must be at least 6 characters long.",
          });
          return false;
        }
      }
    }
    return true;
  };

  const handleEmailAuth = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (type === "register") {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        await updateProfile(userCredential.user, {
          displayName: formData.displayName,
        });

        toast({
          title: "Account Created",
          description: "Your account has been created successfully!",
        });
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        toast({
          title: "Sign In Successful",
          description: "Welcome back!",
        });
      }

      router.push('/dashboard');
    } catch (error) {
      const appError = handleGenericError(error);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: appError.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Authentication Successful",
        description: "Redirecting you to the dashboard...",
      });
      router.push('/dashboard');
    } catch (error) {
      const appError = handleGenericError(error);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: appError.message,
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="w-full max-w-md">
       <div className="flex items-center justify-center gap-2 mb-6">
            <CheckCircle className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">QuizLink</span>
        </div>
      <Tabs defaultValue="teacher" className="w-full" onValueChange={setUserType}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="teacher">Teacher</TabsTrigger>
          <TabsTrigger value="student">Student</TabsTrigger>
        </TabsList>
        <TabsContent value="teacher">
          <Card>
            <CardHeader>
              <CardTitle>{title} as a Teacher</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={authMethod === "google" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAuthMethod("google")}
                  className="flex-1"
                >
                  Google
                </Button>
                <Button
                  type="button"
                  variant={authMethod === "email" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAuthMethod("email")}
                  className="flex-1"
                >
                  Email
                </Button>
              </div>

              {authMethod === "google" ? (
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                  {isLoading ? "Redirecting..." : <><GoogleIcon /> Sign in with Google</>}
                </Button>
              ) : (
                <div className="space-y-3">
                  {type === "register" && (
                    <div>
                      <Input
                        name="displayName"
                        type="text"
                        placeholder="Full Name"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                  <div>
                    <Input
                      name="email"
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Input
                      name="password"
                      type="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                  {type === "register" && (
                    <div>
                      <Input
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                  <Button className="w-full" onClick={handleEmailAuth} disabled={isLoading}>
                    {isLoading ? "Processing..." : type === "register" ? "Create Account" : "Sign In"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="student">
          <Card>
            <CardHeader>
              <CardTitle>{title} as a Student</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={authMethod === "google" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAuthMethod("google")}
                  className="flex-1"
                >
                  Google
                </Button>
                <Button
                  type="button"
                  variant={authMethod === "email" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAuthMethod("email")}
                  className="flex-1"
                >
                  Email
                </Button>
              </div>

              {authMethod === "google" ? (
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                  {isLoading ? "Redirecting..." : <><GoogleIcon /> Sign in with Google</>}
                </Button>
              ) : (
                <div className="space-y-3">
                  {type === "register" && (
                    <div>
                      <Input
                        name="displayName"
                        type="text"
                        placeholder="Full Name"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                  <div>
                    <Input
                      name="email"
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Input
                      name="password"
                      type="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                  {type === "register" && (
                    <div>
                      <Input
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                  <Button className="w-full" onClick={handleEmailAuth} disabled={isLoading}>
                    {isLoading ? "Processing..." : type === "register" ? "Create Account" : "Sign In"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
       <div className="mt-4 text-center text-sm">
        {type === 'login' ? (
          <p>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="underline">
              Sign up
            </Link>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
