import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/shells/shell";
import { auth } from "@/auth";
import { quoteTagService } from "@/lib/services/public-quote/quote-tag.service";
import { tagService } from "@/lib/services/tag/tag.service";
import { TagHeader } from "@/components/tags/TagHeader";
import { TagQuotesList } from "@/components/tags/TagQuotesList";
import { TagPagination } from "@/components/tags/TagPagination";
import { TagSort } from "@/components/tags/TagSort";
import { Suspense } from "react";
import { TagsLoadingSkeleton } from "./loading";
import { absoluteUrl } from "@/lib/utils";

// Define search params interface
interface TagSearchParams {
  page?: string;
  sort?: string;
  limit?: string;
}

// Define page props interface
interface TagPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<TagSearchParams>;
}

export async function generateMetadata({ 
  params 
}: TagPageProps): Promise<Metadata> {
  // Await the params before using them
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  try {
    // Fetch tag data for metadata
    const tag = await quoteTagService.getTagBySlug(slug);
    
    // Get tag quote count
    const quoteCount = tag._count?.quotes || 0;
    
    // Create a meaningful description that includes the quote count
    const description = `Explore ${quoteCount} quotes tagged with #${tag.name}. Find inspiring, motivating, and thought-provoking quotes from influential figures on gulfquotes.`;
    
    // Format tag name for titles
    const formattedTagName = tag.name.charAt(0).toUpperCase() + tag.name.slice(1);
    
    // Create canonical URL
    const canonicalUrl = absoluteUrl(`/tags/${slug}`);
    
    return {
      title: `#${formattedTagName} Quotes | ${quoteCount} Quotes Tagged with ${formattedTagName}`,
      description,
      openGraph: {
        title: `#${formattedTagName} Quotes | gulfquotes`,
        description,
        url: canonicalUrl,
        siteName: 'gulfquotes',
        type: 'website',
        locale: 'en_US',
        images: [
          {
            url: absoluteUrl('/og-image.jpg'),
            width: 1200,
            height: 630,
            alt: `Quotes tagged with #${tag.name}`,
          }
        ]
      },
      twitter: {
        card: 'summary_large_image',
        title: `#${formattedTagName} Quotes | gulfquotes`,
        description,
        images: [absoluteUrl('/og-image.jpg')],
        creator: '@gulfquotes',
        site: '@gulfquotes'
      },
      alternates: {
        canonical: canonicalUrl,
      },
      keywords: [`${tag.name} quotes`, 'quotes', 'inspirational quotes', tag.name, 'gulf quotes'],
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        }
      }
    };
  } catch (error) {
    // Log the error for debugging
    console.error("[TAG_METADATA]", error);
    
    // Return fallback metadata
    const formattedTagName = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return {
      title: `#${formattedTagName} Quotes | gulfquotes`,
      description: `Browse our collection of quotes tagged with #${formattedTagName}`,
      openGraph: {
        title: `#${formattedTagName} Quotes | gulfquotes`,
        description: `Browse our collection of quotes tagged with #${formattedTagName}`,
        url: absoluteUrl(`/tags/${slug}`),
        siteName: 'gulfquotes',
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: `#${formattedTagName} Quotes | gulfquotes`,
        description: `Browse our collection of quotes tagged with #${formattedTagName}`,
      },
      robots: {
        index: true,
        follow: true,
      }
    };
  }
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  // Await the params before using them
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  // Await searchParams before using them
  const resolvedSearchParams = await searchParams || {};
  
  // Parse search parameters with defaults
  const page = Number(resolvedSearchParams?.page) || 1;
  const sort = (resolvedSearchParams?.sort as "recent" | "popular" | "alphabetical") || "recent";
  const limit = Number(resolvedSearchParams?.limit) || 12;
  
  try {
    // Fetch the tag data and related tags in parallel
    const [tag, relatedTags] = await Promise.all([
      quoteTagService.getTagBySlug(slug),
      tagService.getRelatedTags(slug, 5).catch(() => []) // Get related tags but don't fail if this errors
    ]);
    
    if (!tag) {
      notFound();
    }
    
    // Get current user session if any (for likes/bookmarks)
    const session = await auth();
    const userId = session?.user?.id;
    
    // Fetch quotes for this tag
    const quotesData = await quoteTagService.getQuotesByTag({
      slug,
      page,
      limit,
      sortBy: sort,
      userId
    });
    
    // Calculate total pages for pagination
    const totalPages = Math.ceil(quotesData.total / limit);
    
    return (
      <Shell>
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Tag Header */}
          <TagHeader tag={tag} />
          
          {/* Filter & Sort Controls */}
          <TagSort 
            sort={sort}
            total={quotesData.total}
            count={quotesData.quotes.length}
          />
          
          <Suspense fallback={<TagsLoadingSkeleton />}>
            {/* Quotes List */}
            <TagQuotesList 
              quotes={quotesData.quotes} 
              isLoading={false}
              emptyMessage={`No quotes found with the #${tag.name} tag`}
            />
            
            {/* Pagination */}
            {totalPages > 1 && (
              <TagPagination 
                totalPages={totalPages} 
                currentPage={page}
                className="pt-4"
              />
            )}
          </Suspense>
          
          {/* Show related tags if available */}
          {relatedTags && relatedTags.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-3">Related Tags</h2>
              <div className="flex flex-wrap gap-2">
                {relatedTags.map(tag => (
                  <a
                    key={tag.id}
                    href={`/tags/${tag.slug}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-sm"
                  >
                    #{tag.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("[TAG_PAGE]", error);
    notFound();
  }
}