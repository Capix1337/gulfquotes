import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
import type { TagQuotesParams } from "@/types/tag";
import type { QuoteDisplayData } from "./types";
import { quoteLikeService } from "@/lib/services/like";
import { quoteBookmarkService } from "@/lib/services/bookmark";
import { Prisma } from "@prisma/client";

interface QuoteByTagResult {
  quotes: QuoteDisplayData[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
  tagName: string;
  tagSlug: string;
}

class QuoteTagService {
  /**
   * Get a tag by slug
   */
  async getTagBySlug(slug: string) {
    const tag = await db.tag.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { quotes: true }
        }
      }
    });

    if (!tag) {
      throw new AppError("Tag not found", "NOT_FOUND", 404);
    }

    return tag;
  }

  /**
   * Get quotes by tag slug with pagination and sorting
   */
  async getQuotesByTag({
    slug,
    page = 1,
    limit = 12,
    sortBy = "recent",
    userId
  }: TagQuotesParams & { userId?: string }): Promise<QuoteByTagResult> {
    try {
      // Validate the slug
      if (!slug) {
        throw new AppError("Tag slug is required", "BAD_REQUEST", 400);
      }

      // Calculate pagination values
      const skip = (page - 1) * limit;
      const take = Math.min(50, Math.max(1, limit)); // Limit between 1-50

      // Find the tag first to get its ID and verify it exists
      const tag = await db.tag.findUnique({
        where: { slug },
        select: {
          id: true,
          name: true,
          slug: true,
        }
      });

      if (!tag) {
        throw new AppError("Tag not found", "NOT_FOUND", 404);
      }

      // Determine sort order
      let orderBy: Prisma.QuoteOrderByWithRelationInput;
      switch (sortBy) {
        case "popular":
          orderBy = { likes: "desc" };
          break;
        case "alphabetical":
          orderBy = { content: "asc" };
          break;
        case "recent":
        default:
          orderBy = { createdAt: "desc" };
          break;
      }

      // Fetch quotes with this tag and count in parallel
      const [quotes, total] = await Promise.all([
        db.quote.findMany({
          where: {
            tags: {
              some: {
                id: tag.id
              }
            }
          },
          include: {
            authorProfile: {
              include: {
                images: {
                  take: 1
                },
                _count: {
                  select: {
                    quotes: true
                  }
                }
              }
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            gallery: {  // Added this inclusion
              include: {
                gallery: true
              }
            },
            tags: {  // Also include tags for completeness
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          },
          skip,
          take,
          orderBy
        }),
        db.quote.count({
          where: {
            tags: {
              some: {
                id: tag.id
              }
            }
          }
        })
      ]);

      // Transform quotes to match the QuoteDisplayData interface
      let transformedQuotes = quotes.map(quote => ({
        ...quote,
        authorProfile: {
          ...quote.authorProfile,
          image: quote.authorProfile.images?.[0]?.url || null,
          images: undefined,
          quoteCount: quote.authorProfile._count.quotes
        },
        gallery: quote.gallery.map(g => ({  // Add the gallery property transformation
          gallery: g.gallery,
          isActive: g.isActive,
          isBackground: g.isActive && g.gallery.url === quote.backgroundImage
        })),
        isLiked: false,
        isBookmarked: false
      })) as QuoteDisplayData[];

      // Add like/bookmark status if userId is provided
      if (userId && transformedQuotes.length > 0) {
        const quoteIds = transformedQuotes.map(q => q.id);
        const [likeStatus, bookmarkStatus] = await Promise.all([
          quoteLikeService.getUserLikes(userId, quoteIds),
          quoteBookmarkService.getUserBookmarks(userId, quoteIds)
        ]);
        
        transformedQuotes = transformedQuotes.map(quote => ({
          ...quote,
          isLiked: likeStatus[quote.id] || false,
          isBookmarked: bookmarkStatus[quote.id] || false
        }));
      }

      return {
        quotes: transformedQuotes,
        total,
        hasMore: total > skip + quotes.length,
        page,
        limit: take,
        tagName: tag.name,
        tagSlug: tag.slug
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("[QUOTE_TAG_SERVICE]", error);
      throw new AppError("Failed to fetch quotes for tag", "INTERNAL_ERROR", 500);
    }
  }
}

// Export a singleton instance
export const quoteTagService = new QuoteTagService();