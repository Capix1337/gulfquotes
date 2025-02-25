// app/(general)/quotes/[slug]/page.tsx
import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { quoteDisplayService } from "@/lib/services/public-quote/quote-display.service";
import { LoadingQuote } from "./components/quote-loading";
import { ErrorQuote } from "./components/quote-error";
import { QuotePageClient } from "./components/quote-page-client";
// import type { Gallery } from "@prisma/client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function QuotePage({ params }: PageProps) {
  try {
    // Await the params first
    const resolvedParams = await params;
    
    // Fetch the quote data and backgrounds in parallel
    const [quote, backgrounds] = await Promise.all([
      quoteDisplayService.getQuoteBySlug(resolvedParams.slug),
      quoteDisplayService.getQuoteBackgrounds(resolvedParams.slug)
    ]);
    
    // Handle non-existent quote
    if (!quote) {
      notFound();
    }
    
    // Get active background
    const activeBackground = quote.gallery.find(g => g.isActive)?.gallery || null;
    
    // Get the display configuration for the quote
    const displayConfig = quoteDisplayService.getDisplayConfig(quote);

    return (
      <Suspense fallback={<LoadingQuote />}>
        <QuotePageClient 
          quote={quote}
          backgrounds={backgrounds}
          activeBackground={activeBackground}
          fontSize={displayConfig.fontSize}
          quoteId={quote.id} // Pass the ID instead of the handler
        />
      </Suspense>
    );
  } catch (error) {
    console.error("[QUOTE_PAGE]", error);
    return <ErrorQuote error={error instanceof Error ? error.message : "An error occurred"} />;
  }
}