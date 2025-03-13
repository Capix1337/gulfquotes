"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { LoginButton } from "@/components/auth/login-button";
import { Button } from "@/components/ui/button";
import { UserButton } from "@/components/auth/user-button";
import { SearchField } from "@/components/search/SearchField";
import { BookOpen, Home, Users, BookMarked, Calendar, Menu, X } from "lucide-react";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

export function Navbar() {
  const { status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Close mobile menu with ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mobileMenuOpen]);
  
  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <nav className={cn(
        "w-full",
        "bg-background border-b",
        "px-4 lg:px-8 py-2",
        "flex items-center justify-between",
        "sticky top-0 z-40" // Lower z-index from 50 to 40
      )}>
        {/* Left Section - Logo & Desktop Navigation */}
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className={cn(
              "text-xl font-bold",
              "text-foreground hover:text-foreground/90",
              "transition-colors"
            )}
          >
            Gulfquotes
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home size={18} />
              <span>Home</span>
            </Link>
            <Link 
              href="/categories"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <BookMarked size={18} />
              <span>Categories</span>
            </Link>
            <Link 
              href="/quotes"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <BookOpen size={18} />
              <span>Quotes</span>
            </Link>
            <Link 
              href="/authors"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Users size={18} />
              <span>Authors</span>
            </Link>
            <Link 
              href="/birthdays"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Calendar size={18} />
              <span>Birthdays</span>
            </Link>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-xl px-1 md:px-6">
          <SearchField />
        </div>

        {/* Right Section - Actions, Auth & Mobile Menu Toggle */}
        <div className="flex items-center gap-4">
          {status === "loading" ? (
            <div className="h-9 w-24 animate-pulse rounded bg-muted" />
          ) : status === "authenticated" ? (
            <>
              <NotificationDropdown />
              <UserButton />
            </>
          ) : (
            <LoginButton mode="modal">
              <Button variant="secondary" size="sm">
                Sign in
              </Button>
            </LoginButton>
          )}
          
          {/* Mobile menu toggle button - moved to right */}
          <Button 
            variant="ghost" 
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation Drawer - now from right side with higher z-index */}
      <div className={cn(
        "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden", // Higher z-index (50)
        mobileMenuOpen ? "block" : "hidden"
      )}>
        <div className={cn(
          "fixed inset-y-0 right-0 w-3/4 max-w-sm bg-background border-l shadow-lg", // Changed from left to right
          "transform transition-transform duration-200 ease-in-out",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full" // Changed from -translate-x-full to translate-x-full
        )}>
          <div className="flex flex-col gap-2 p-4 pt-8">
            <Link 
              href="/"
              className="flex items-center gap-2 p-3 text-sm rounded-md hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home size={18} />
              <span>Home</span>
            </Link>
            <Link 
              href="/categories"
              className="flex items-center gap-2 p-3 text-sm rounded-md hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              <BookMarked size={18} />
              <span>Categories</span>
            </Link>
            <Link 
              href="/quotes"
              className="flex items-center gap-2 p-3 text-sm rounded-md hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              <BookOpen size={18} />
              <span>Quotes</span>
            </Link>
            <Link 
              href="/authors"
              className="flex items-center gap-2 p-3 text-sm rounded-md hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Users size={18} />
              <span>Authors</span>
            </Link>
            <Link 
              href="/birthdays"
              className="flex items-center gap-2 p-3 text-sm rounded-md hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Calendar size={18} />
              <span>Birthdays</span>
            </Link>
          </div>
        </div>
        
        {/* Close overlay when clicking outside */}
        <div 
          className="fixed inset-0 z-[-1]" 
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      </div>
    </>
  );
}