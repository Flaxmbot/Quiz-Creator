"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { handleGenericError } from "@/lib/error-handling";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      });
      router.push('/');
    } catch (error) {
      const appError = handleGenericError(error);
      toast({
        variant: "destructive",
        title: "Sign Out Failed",
        description: appError.message,
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">QuizLink</span>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-2 sm:gap-4">
                    <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex touch-target min-h-[44px]">
                      <Link href="/dashboard">Dashboard</Link>
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full touch-target">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-primary font-semibold">
                              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-64 sm:w-56" align="end" forceMount>
                        <div className="flex items-center justify-start gap-3 p-3 sm:p-4">
                          <div className="flex flex-col space-y-1 leading-none min-w-0">
                            {user?.displayName && (
                              <p className="font-semibold text-foreground truncate">{user.displayName}</p>
                            )}
                            {user?.email && (
                              <p className="w-[180px] sm:w-[200px] truncate text-xs sm:text-sm text-muted-foreground">
                                {user.email}
                              </p>
                            )}
                          </div>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="touch-target">
                          <Link href="/dashboard" className="flex items-center gap-3">
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Dashboard</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="touch-target">
                          <Link href="/dashboard/profile" className="flex items-center gap-3">
                            <User className="w-4 h-4" />
                            <span>Profile</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="touch-target">
                          <Link href="/dashboard/settings" className="flex items-center gap-3">
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleSignOut}
                          className="hover:bg-destructive/10 hover:text-destructive cursor-pointer touch-target"
                        >
                          <LogOut className="mr-3 h-4 w-4" />
                          <span>Sign Out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-3 touch-target">
                      <Link href="/register">Sign Up</Link>
                    </Button>
                    <Button asChild size="sm" className="text-xs sm:text-sm px-2 sm:px-3 touch-target">
                      <Link href="/login">Sign In</Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}