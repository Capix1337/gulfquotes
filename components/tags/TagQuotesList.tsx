"use client";

import { QuoteDisplayData } from "@/lib/services/public-quote/types";
import { CategoryQuotesList } from "@/components/categories/CategoryQuotesList";
import { cn } from "@/lib/utils";

interface TagQuotesListProps {
  quotes: QuoteDisplayData[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  // Remove tagSlug from the interface if we're not using it
}

export function TagQuotesList({
  quotes,
  isLoading = false,
  emptyMessage = "No quotes found with this tag",
  className,
  // Remove tagSlug from the parameters if we're not using it
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