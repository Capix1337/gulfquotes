import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
import type { ListTagsParams, TagWithQuoteCount } from "@/types/tag";
import { Prisma } from "@prisma/client";

export interface TagService {
  getBySlug(slug: string): Promise<TagWithQuoteCount>;
  getById(id: string): Promise<TagWithQuoteCount>;
  list(options?: ListTagsParams): Promise<{
    items: TagWithQuoteCount[];
    total: number;
    hasMore: boolean;
    page: number;
    limit: number;
  }>;
  getRelatedTags(tagId: string, limit?: number): Promise<TagWithQuoteCount[]>;
  getPopularTags(limit?: number): Promise<TagWithQuoteCount[]>;
  search(query: string, limit?: number): Promise<TagWithQuoteCount[]>;
}

class TagServiceImpl implements TagService {
  /**
   * Get a tag by slug with detailed information
   */
  async getBySlug(slug: string): Promise<TagWithQuoteCount> {
    const tag = await db.tag.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { 
            quotes: true 
          }
        }
      }
    });

    if (!tag) {
      throw new AppError("Tag not found", "NOT_FOUND", 404);
    }

    return tag as TagWithQuoteCount;
  }

  /**
   * Get a tag by ID with detailed information
   */
  async getById(id: string): Promise<TagWithQuoteCount> {
    const tag = await db.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { 
            quotes: true 
          }
        }
      }
    });

    if (!tag) {
      throw new AppError("Tag not found", "NOT_FOUND", 404);
    }

    return tag as TagWithQuoteCount;
  }

  /**
   * List tags with pagination, sorting, and filtering
   */
  async list(options: ListTagsParams = {}): Promise<{
    items: TagWithQuoteCount[];
    total: number;
    hasMore: boolean;
    page: number;
    limit: number;
  }> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        sortBy = "popular",
        order = "desc"
      } = options;

      const skip = (page - 1) * limit;
      const take = Math.min(50, Math.max(1, limit));

      // Build where clause based on search parameter
      const where: Prisma.TagWhereInput = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Build orderBy based on sortBy and order parameters
      let orderBy: Prisma.TagOrderByWithRelationInput;
      switch (sortBy) {
        case "name":
          orderBy = { name: order };
          break;
        case "recent":
          orderBy = { createdAt: order };
          break;
        case "popular":
        default:
          orderBy = {
            quotes: {
              _count: order
            }
          };
          break;
      }

      // Fetch tags and count in parallel
      const [tags, total] = await Promise.all([
        db.tag.findMany({
          where,
          include: {
            _count: {
              select: { quotes: true }
            }
          },
          orderBy,
          skip,
          take
        }),
        db.tag.count({ where })
      ]);

      return {
        items: tags as TagWithQuoteCount[],
        total,
        hasMore: total > skip + tags.length,
        page,
        limit: take
      };
    } catch (error) {
      console.error("[TAG_SERVICE]", error);
      throw new AppError("Failed to fetch tags", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Get related tags based on co-occurrence in quotes
   */
  async getRelatedTags(tagId: string, limit = 5): Promise<TagWithQuoteCount[]> {
    // Get quotes with this tag
    const quotesWithTag = await db.quote.findMany({
      where: {
        tags: {
          some: {
            id: tagId
          }
        }
      },
      select: {
        id: true
      }
    });

    const quoteIds = quotesWithTag.map(q => q.id);

    // Find tags that appear in the same quotes, excluding the current tag
    const relatedTags = await db.tag.findMany({
      where: {
        id: { not: tagId },
        quotes: {
          some: {
            id: {
              in: quoteIds
            }
          }
        }
      },
      include: {
        _count: {
          select: { quotes: true }
        }
      },
      orderBy: {
        quotes: {
          _count: 'desc'
        }
      },
      take: limit
    });

    return relatedTags as TagWithQuoteCount[];
  }

  /**
   * Get popular tags based on quote count
   */
  async getPopularTags(limit = 10): Promise<TagWithQuoteCount[]> {
    const tags = await db.tag.findMany({
      include: {
        _count: {
          select: { quotes: true }
        }
      },
      orderBy: {
        quotes: {
          _count: 'desc'
        }
      },
      take: limit
    });

    return tags as TagWithQuoteCount[];
  }

  /**
   * Search tags by name or description
   */
  async search(query: string, limit = 10): Promise<TagWithQuoteCount[]> {
    if (!query.trim()) {
      return this.getPopularTags(limit);
    }

    const tags = await db.tag.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        _count: {
          select: { quotes: true }
        }
      },
      orderBy: {
        quotes: {
          _count: 'desc'
        }
      },
      take: limit
    });

    return tags as TagWithQuoteCount[];
  }
}

// Export a singleton instance
export const tagService = new TagServiceImpl();