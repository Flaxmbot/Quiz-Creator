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
import { CheckCircle, Home, User, Settings, PlusCircle, BookOpen, Menu } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile } from "@/lib/firestore";
import { useState, useEffect } from "react";
import type { User as UserType } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const [user] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<UserType | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

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

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <SidebarProvider>
      <Sidebar 
        className={`futuristic-card border-r border-border/20 backdrop-blur-xl transition-transform duration-300 ${
          isMobile ? 'fixed inset-y-0 left-0 z-50 w-72' : ''
        } ${isMobile && !sidebarOpen ? '-translate-x-full' : ''}`}
      >
        <SidebarContent className="custom-scrollbar">
          <SidebarHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-md -z-10"></div>
              </div>
              <span className="text-xl sm:text-2xl font-bold tracking-tight">QuizLink</span>
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
      <SidebarInset className={isMobile && sidebarOpen ? 'pointer-events-none' : ''}>
        <div className="flex h-14 sm:h-16 items-center gap-3 sm:gap-4 border-b border-border/20 bg-background/80 backdrop-blur-xl px-4 sm:px-6 py-3 shadow-sm">
          <div className="flex-1">
            {/* The title can be dynamic based on the page */}
          </div>
        </div>
        <main className="flex-1 p-4 sm:p-6 custom-scrollbar">{children}</main>
      </SidebarInset>
      
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 sm:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
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