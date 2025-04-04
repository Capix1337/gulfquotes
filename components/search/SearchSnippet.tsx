import { highlightMatches } from "@/lib/search";
import { cn } from "@/lib/utils";
import React from "react";

interface SearchSnippetProps {
  text: string;
  query: string;
  className?: string;
  options?: {
    caseSensitive?: boolean;
    wholeWord?: boolean;
  };
}

export function SearchSnippet({
  text,
  query,
  className,
  options = {},
}: SearchSnippetProps) {
  // Apply highlighting to text
  const highlightedText = highlightMatches(text, query, options);
  
  // Return the highlighted text as HTML
  return (
    <span 
      className={cn("search-snippet", className)}
      dangerouslySetInnerHTML={{ 
        __html: highlightedText 
      }}
    />
  );
}

