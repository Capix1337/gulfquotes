"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuthorExternalLinkProps {
  title: string | null;
  url: string | null;
  className?: string;
}

export function AuthorExternalLink({ title, url, className }: AuthorExternalLinkProps) {
  // Don't render anything if either title or URL is missing
  if (!title || !url) {
    return null;
  }

  return (
    <div className={cn("mt-4", className)}>
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-2"
        asChild
      >
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          aria-label={`${title} (opens in a new tab)`}
        >
          <span>{title}</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </Button>
    </div>
  );
}