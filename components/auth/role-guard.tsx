"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile } from "@/lib/firestore";
import { useState, useEffect } from "react";
import type { User } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('teacher' | 'student')[];
  fallbackMessage?: string;
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallbackMessage = "You don't have permission to access this page." 
}: RoleGuardProps) {
  const [user, loading] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          setIsProfileLoading(true);
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        } finally {
          setIsProfileLoading(false);
        }
      } else if (!loading) {
        setIsProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, loading]);

  // Show loading skeleton while checking authentication and profile
  if (loading || isProfileLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="space-y-3 sm:space-y-4">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  // Redirect if not authenticated (handled by AuthGuard typically)
  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="futuristic-card p-8 text-center">
          <CardContent>
            <h2 className="text-2xl font-bold text-muted-foreground mb-2">Authentication Required</h2>
            <p className="text-muted-foreground">Please log in to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show access denied if user role is not allowed
  if (!userProfile || !allowedRoles.includes(userProfile.role)) {
    const isStudentTryingTeacherAction = userProfile?.role === 'student' && allowedRoles.includes('teacher');
    const isTeacherTryingStudentAction = userProfile?.role === 'teacher' && allowedRoles.includes('student');
    
    let specificMessage = fallbackMessage;
    let actionButton = (
      <Button asChild className="w-full touch-target">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
    );

    if (isStudentTryingTeacherAction) {
      specificMessage = "This feature is only available to teachers. As a student, you can take quizzes and view your results from the dashboard.";
      actionButton = (
        <Button asChild className="w-full touch-target">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Browse Available Quizzes
          </Link>
        </Button>
      );
    } else if (isTeacherTryingStudentAction) {
      specificMessage = "This feature is designed for students. As a teacher, you can create and manage quizzes from your dashboard.";
      actionButton = (
        <Button asChild className="w-full touch-target">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Manage Your Quizzes
          </Link>
        </Button>
      );
    }

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="futuristic-card p-8 sm:p-12 text-center max-w-md mx-auto">
          <CardContent className="space-y-6">
            <div className="relative">
              <AlertTriangle className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-yellow-400" />
              <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl -z-10"></div>
            </div>
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold">Access Restricted</h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {specificMessage}
              </p>
              <div className="bg-muted/50 rounded-lg p-3 mt-4">
                <p className="text-xs text-muted-foreground">
                  Your current role: <span className="font-semibold text-primary">{userProfile?.role || 'Unknown'}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Required role(s): <span className="font-semibold text-primary">{allowedRoles.join(', ')}</span>
                </p>
              </div>
            </div>
            {actionButton}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render children if user has proper role
  return <>{children}</>;
}