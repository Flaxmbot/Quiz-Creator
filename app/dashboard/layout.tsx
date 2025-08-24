"use client";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { CheckCircle, Home, User, Settings, PlusCircle, BookOpen } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile } from "@/lib/firestore";
import { useState, useEffect } from "react";
import type { User as UserType } from "@/lib/types";

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const [user] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<UserType | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  return (
    <SidebarProvider>
      <Sidebar className="futuristic-card border-r border-border/20 backdrop-blur-xl">
        <SidebarContent className="custom-scrollbar">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <CheckCircle className="w-10 h-10 text-primary" />
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-md -z-10"></div>
              </div>
              <span className="text-2xl font-bold tracking-tight">QuizLink</span>
            </div>
          </SidebarHeader>
          <SidebarMenu className="space-y-2 px-3">
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="group hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-xl">
                <Link href="/dashboard" className="flex items-center gap-3 p-3">
                  <Home className="w-5 h-5 group-hover:animate-pulse" />
                  <span className="font-medium">
                    {userProfile?.role === 'student' ? 'Available Quizzes' : 'My Quizzes'}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {userProfile?.role === 'teacher' && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="group hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-xl">
                  <Link href="/create" className="flex items-center gap-3 p-3">
                    <PlusCircle className="w-5 h-5 group-hover:animate-pulse" />
                    <span className="font-medium">Create Quiz</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {userProfile?.role === 'student' && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="group hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-xl">
                  <Link href="/dashboard/history" className="flex items-center gap-3 p-3">
                    <BookOpen className="w-5 h-5 group-hover:animate-pulse" />
                    <span className="font-medium">Quiz History</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="group hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-xl">
                <Link href="/dashboard/profile" className="flex items-center gap-3 p-3">
                  <User className="w-5 h-5 group-hover:animate-pulse" />
                  <span className="font-medium">Profile</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="group hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-xl">
                <Link href="/dashboard/settings" className="flex items-center gap-3 p-3">
                  <Settings className="w-5 h-5 group-hover:animate-pulse" />
                  <span className="font-medium">Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex h-16 items-center gap-4 border-b border-border/20 bg-background/80 backdrop-blur-xl px-6 py-3 shadow-sm">
          <SidebarTrigger className="sm:hidden hover:bg-primary/10 transition-colors duration-200 rounded-lg p-2" />
          <div className="flex-1">
            {/* The title can be dynamic based on the page */}
          </div>
        </div>
        <main className="flex-1 p-6 custom-scrollbar">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthGuard>
  );
}