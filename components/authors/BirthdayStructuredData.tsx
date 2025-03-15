"use client";

import { MONTH_NAMES_CAPITALIZED } from "@/lib/date-utils";
import { useMemo } from "react";

interface BirthdayAuthor {
  id: string;
  name: string;
  slug: string;
  bio?: string | null;
  born?: string | null;
  died?: string | null;
  image?: string | null;
  quoteCount?: number;
  followers?: number;
}

interface BirthdayStructuredDataProps {
  day: number;
  month: number;
  authors: Array<BirthdayAuthor>;
  totalAuthors: number;
}

export function BirthdayStructuredData({ day, month, authors, totalAuthors }: BirthdayStructuredDataProps) {
  // Use useMemo to ensure consistent rendering between server and client
  const jsonContent = useMemo(() => {
    const formattedDate = `${MONTH_NAMES_CAPITALIZED[month - 1]} ${day}`;
    // Use a fixed date rather than the current date to avoid hydration mismatch
    const currentYear = new Date().getFullYear();
    
    // Create the structured data object
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": authors.map((author, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Person",
            "name": author.name,
            "description": author.bio || undefined,
            "birthDate": author.born || undefined,
            "deathDate": author.died || undefined,
            "url": `https://gulfquotes.ae/authors/${author.slug}`,
            "image": author.image || undefined
          }
        })),
        "numberOfItems": totalAuthors
      },
      "name": `Authors Born on ${formattedDate}`,
      "description": `List of authors, writers, and notable figures who were born on ${formattedDate}.`,
      // Use fixed dates to prevent hydration mismatches
      "datePublished": `${currentYear}-01-01T00:00:00Z`,
      "dateModified": `${currentYear}-01-01T00:00:00Z`,
      "isPartOf": {
        "@type": "WebSite",
        "name": "gulfquotes",
        "url": "https://gulfquotes.ae"
      }
    };
    
    // Use a stable JSON stringify to ensure consistent ordering of object keys
    return JSON.stringify(structuredData);
  }, [day, month, authors, totalAuthors]);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonContent }}
    />
  );
}