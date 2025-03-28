"use client";

import { useEffect } from "react";
import { Shell } from "@/components/shells/shell";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link"; // Import Link from next/link

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TagError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <Shell>
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Something went wrong
            </h1>
            <p className="text-muted-foreground max-w-[600px]">
              We encountered an error while trying to load this tag page. Please try again.
            </p>
            <p className="text-sm text-muted-foreground">
              Error: {error.message || "Unknown error"}
            </p>
          </div>
          <Button onClick={reset} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/tags">Back to Tags</Link>
          </Button>
        </div>
      </div>
    </Shell>
  );
}