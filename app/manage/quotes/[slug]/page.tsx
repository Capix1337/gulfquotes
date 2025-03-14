// app/manage/quotes/[slug]/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EditQuoteForm } from "@/components/quotes/edit-quote-form";
import { Shell } from "@/components/shells/shell";
import db from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";

// Add metadata
export const metadata: Metadata = {
  title: "Edit Quote",
  description: "Edit an existing quote"
};

// Update the interface to match Next.js requirements
interface EditQuotePageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[]>>;
}

export default async function EditQuotePage({
  params: paramsPromise,
}: EditQuotePageProps) {
  // Check for an authenticated session
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  // Only ADMINs or AUTHORS are allowed for quote editing
  if (session.user.role !== "ADMIN" && session.user.role !== "AUTHOR") {
    redirect("/unauthorized");
  }

  try {
    // Resolve params promise first
    const params = await paramsPromise;
    
    // Fetch the quote, categories and author profiles in parallel
    const [quote, categories, authorProfiles] = await Promise.all([
      // Fetch quote by slug
      db.quote.findUnique({
        where: { slug: params.slug },
        include: {
          category: true,
          authorProfile: true,
          tags: true, // Add this to include tags
          gallery: {
            include: {
              gallery: true
            }
          }
        }
      }),
      // Fetch categories
      db.category.findMany(),
      // Fetch author profiles
      db.authorProfile.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          born: true,
          died: true,
          // Add new structured date fields
          bornDay: true,
          bornMonth: true,
          bornYear: true,
          diedDay: true,
          diedMonth: true,
          diedYear: true,
          birthPlace: true,
          influences: true,
          bio: true,
          createdAt: true,
          updatedAt: true,
          followers: true,
          // Add these missing external link fields
          externalLinkTitle: true,
          externalLinkUrl: true,
        },
        orderBy: {
          name: 'asc'
        }
      })
    ]);

    // Handle non-existent quote
    if (!quote) {
      notFound();
    }

    // Transform the quote data to match EditQuoteFormProps interface
    const transformedQuote = {
      ...quote,
      gallery: quote.gallery.map(g => ({
        gallery: g.gallery, // Keep the nested gallery object
        isActive: g.isActive
      })),
      backgroundImage: quote.backgroundImage || null,
      tags: quote.tags
    };

    return (
      <Shell>
        <div className="flex flex-col gap-8 p-8">
          <div className="mx-auto w-full max-w-6xl">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight">Edit Quote</h1>
                <p className="text-sm text-muted-foreground">
                  Make changes to your quote
                </p>
              </div>
            </div>

            {/* Main Content */}
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"/>
              </div>
            }>
              <EditQuoteForm 
                quote={transformedQuote}
                categories={categories}
                authorProfiles={authorProfiles}
              />
            </Suspense>
          </div>
        </div>
      </Shell>
    );

  } catch (error) {
    console.error("[EDIT_QUOTE_PAGE]", error);
    return (
      <Shell>
        <div className="flex flex-col gap-8 p-8">
          <div className="mx-auto w-full max-w-6xl">
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <h3 className="font-semibold">Something went wrong</h3>
              <p className="text-sm text-muted-foreground">
                Failed to load quote. Please try again later.
              </p>
              <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
                Try again
              </Button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }
}
