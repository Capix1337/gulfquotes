import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/shells/shell";
import { auth } from "@/auth";
import { quoteTagService } from "@/lib/services/public-quote/quote-tag.service";
import { TagHeader } from "@/components/tags/TagHeader";
import { CategoryQuotesList } from "@/components/categories/CategoryQuotesList";
import { CategoryPagination } from "@/components/categories/CategoryPagination";
import { CategorySort } from "@/components/categories/CategorySort";

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
    
    return {
      title: `#${tag.name} Quotes | gulfquotes`,
      description: `Browse our collection of quotes tagged with #${tag.name}`,
    };
  } catch (error) {
    // Log the error for debugging
    console.error("[TAG_METADATA]", error);
    
    // Return fallback metadata
    return {
      title: `#${slug.replace(/-/g, ' ')} Quotes | gulfquotes`,
      description: `Browse our collection of quotes tagged with #${slug.replace(/-/g, ' ')}`,
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
    // Fetch the tag data
    const tag = await quoteTagService.getTagBySlug(slug);
    
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
          <CategorySort 
            sort={sort}
            total={quotesData.total}
            count={quotesData.quotes.length}
          />
          
          {/* Quotes List */}
          <CategoryQuotesList 
            quotes={quotesData.quotes} 
            isLoading={false}
            emptyMessage={`No quotes found with the #${tag.name} tag`}
          />
          
          {/* Pagination */}
          {totalPages > 1 && (
            <CategoryPagination 
              totalPages={totalPages} 
              currentPage={page}
              className="pt-4"
            />
          )}
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("[TAG_PAGE]", error);
    notFound();
  }
}