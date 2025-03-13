"use client"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, Home, ArrowLeft } from "lucide-react";
import { Shell } from "@/components/shells/shell";

export default function NotFound() {
  return (
    <Shell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto p-6">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Search className="h-12 w-12 text-muted-foreground" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-6">
          We couldn&apos;t find the page you&apos;re looking for. The link might be incorrect, 
          or the page may have been moved or deleted.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </Shell>
  );
}