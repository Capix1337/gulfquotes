// app/(general)/authors/[slug]/page.tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { authorProfileService } from "@/lib/services/author-profile.service";
import { authorFollowService } from "@/lib/services/follow";
import { AuthorPageHeader } from "@/components/authors/AuthorPageHeader";
import { AuthorGallery } from "@/components/authors/AuthorGallery";
import { AuthorBioSection } from "@/components/authors/AuthorBioSection";
import { AuthorQuotesList } from "@/components/authors/AuthorQuotesList";
import type { Metadata } from "next";
// Remove the unused import
// import { fetchAuthors } from "@/lib/authors";

// Define interface for page props
interface AuthorPageProps {
  params: Promise<{ slug: string }>;
}

// Define an error type for our application errors
interface AppErrorWithCode {
  code?: string;
  message: string;
}

// Generate dynamic metadata for SEO
export async function generateMetadata(
  { params }: AuthorPageProps
): Promise<Metadata> {
  try {
    // Await params before using
    const resolvedParams = await params;
    const author = await authorProfileService.getBySlug(resolvedParams.slug);
    
    return {
      title: `${author.name} | Author Profile | gulfquotes`,
      description: author.bio?.substring(0, 160) || `Quotes by ${author.name}`,
    };
  } catch {
    return {
      title: "Author | gulfquotes",
      description: "View author profile and quotes",
    };
  }
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  // Get authenticated user (if any)
  const session = await auth();
  // Await params before using
  const resolvedParams = await params;
  
  try {
    // Use resolved params
    const author = await authorProfileService.getBySlug(resolvedParams.slug);
    
    if (!author) {
      notFound();
    }
    
    // For the missing getQuoteCount function, use an alternative approach
    // We can get the quote count from a direct database query or use _count from the author
    // Let's use the quotes count from the author profile directly
    
    const isFollowed = session?.user?.id 
      ? await authorFollowService.getFollowStatus(author.id, session.user.id) 
      : false;
    
    // Use the count from the Prisma response or fetch separately if needed
    const quoteCount = author._count?.quotes || 0;
    
    // Transform data to match expected format for the UI components
    const authorData = {
      id: author.id,
      name: author.name,
      slug: author.slug,
      bio: author.bio,
      born: author.born,
      died: author.died,
      // Add structured date fields
      bornDay: author.bornDay,
      bornMonth: author.bornMonth,
      bornYear: author.bornYear,
      diedDay: author.diedDay,
      diedMonth: author.diedMonth,
      diedYear: author.diedYear,
      birthPlace: author.birthPlace,
      // Add external link fields
      externalLinkTitle: author.externalLinkTitle,
      externalLinkUrl: author.externalLinkUrl,
      image: author.images[0]?.url || null,
      influences: author.influences,
      quoteCount: quoteCount,
      followers: author.followers,
      isFollowed: isFollowed,
      totalQuotes: quoteCount,
    };

    return (
      <div className="container py-8 space-y-6">
        <Suspense fallback={<div>Loading author information...</div>}>
          <AuthorPageHeader author={authorData} />
        </Suspense>
        
        <Suspense fallback={<div>Loading author details...</div>}>
          <AuthorBioSection 
            bio={author.bio} 
            influences={author.influences}
            externalLinkTitle={author.externalLinkTitle}
            externalLinkUrl={author.externalLinkUrl}
          />
        </Suspense>
        
        <Suspense fallback={<div>Loading author gallery...</div>}>
          <AuthorGallery 
            images={author.images.map(img => ({ id: img.id || String(Math.random()), url: img.url }))} 
            authorName={author.name} 
          />
        </Suspense>
        
        <Suspense fallback={<div>Loading author quotes...</div>}>
          <AuthorQuotesList 
            authorId={author.id}
            authorName={author.name}
            authorSlug={author.slug}
          />
        </Suspense>
        
        {/* More sections will be added in future phases */}
      </div>
    );
  } catch (error) {
    console.error("[AUTHOR_PAGE]", error);
    
    // Handle different types of errors with proper typing
    if (isErrorWithCode(error) && error.code === "NOT_FOUND") {
      notFound();
    }
    
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground mt-2">
            Failed to load author profile. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}

// Type guard function to check if an error has a code property
function isErrorWithCode(error: unknown): error is AppErrorWithCode {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  );
}
