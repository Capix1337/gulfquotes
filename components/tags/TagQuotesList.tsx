"use client";

import { QuoteDisplayData } from "@/lib/services/public-quote/types";
import { CategoryQuotesList } from "@/components/categories/CategoryQuotesList";
import { cn } from "@/lib/utils";

interface TagQuotesListProps {
  quotes: QuoteDisplayData[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  tagSlug?: string;
}

export function TagQuotesList({
  quotes,
  isLoading = false,
  emptyMessage = "No quotes found with this tag",
  className,
  tagSlug,
}: TagQuotesListProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* We're reusing the CategoryQuotesList component since it has the same functionality */}
      <CategoryQuotesList
        quotes={quotes}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        className="mt-4"
      />
    </div>
  );
}