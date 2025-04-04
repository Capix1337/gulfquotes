import db from "@/lib/prisma";
import type { ListQuotesResult } from "../quote/types";
import type { ListQuotesParams } from "@/types/api/quotes";
import type { QuoteDisplayData } from "./types";
import { quoteFilterUtils } from "./utils/quote-filter.utils";
import { quoteSortUtils } from "./utils/quote-sort.utils";

class PublicQuoteService {
  async list(params: ListQuotesParams): Promise<ListQuotesResult> {
    const page = params.page || 1;
    const limit = params.limit || 12;
    const skip = (page - 1) * limit;

    // Use filter utils to build where conditions
    const whereConditions = quoteFilterUtils.buildWhereConditions({
      search: params.search,
      categoryId: params.categoryId,
      authorProfileId: params.authorProfileId
    });

    // Use sort utils for ordering
    const orderBy = quoteSortUtils.getPrismaSortOptions(params.sortBy || 'recent');

    const [items, total] = await Promise.all([
      db.quote.findMany({
        where: whereConditions,
        include: {
          authorProfile: true,
          category: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.quote.count({ where: whereConditions })
    ]);

    return {
      items,
      total,
      hasMore: total > skip + items.length,
      page,
      limit
    };
  }

  async getQuoteBySlug(slug: string): Promise<QuoteDisplayData | null> {
    try {
      const quote = await db.quote.findUnique({
        where: { slug },
        include: {
          authorProfile: {
            select: {
              id: true,       // Add this field
              name: true,
              slug: true,
              images: {
                select: {
                  url: true
                },
                take: 1
              },
              bio: true,
            }
          },
          category: {
            select: {
              name: true,
              slug: true,
            }
          },
          gallery: {
            include: {
              gallery: true
            }
          },
          tags: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          },
        }
      });

      if (!quote) return null;

      // Transform the data to match QuoteDisplayData interface
      const transformedQuote = {
        ...quote,
        authorProfile: {
          id: quote.authorProfile.id,    // Include the id
          name: quote.authorProfile.name,
          slug: quote.authorProfile.slug,
          image: quote.authorProfile.images[0]?.url || null,
          bio: quote.authorProfile.bio
        },
        gallery: quote.gallery.map(g => ({
          gallery: g.gallery,
          isActive: g.isActive,
          isBackground: g.isBackground
        }))
      };

      return transformedQuote as QuoteDisplayData;
    } catch (error) {
      console.error("[QUOTE_DISPLAY_SERVICE]", error);
      throw new Error("Failed to fetch quote");
    }
  }
}

export const publicQuoteService = new PublicQuoteService();