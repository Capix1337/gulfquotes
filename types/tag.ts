import type { Tag as PrismaTag } from "@prisma/client";

export type Tag = PrismaTag;

export interface TagWithQuoteCount extends Tag {
  _count: {
    quotes: number;
  };
}

export interface TagApiResponse {
  data?: TagWithQuoteCount;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * API response for a paginated list of tags
 */
export interface TagsApiResponse {
  data?: {
    items: TagWithQuoteCount[];
    total: number;
    hasMore: boolean;
    page: number;
    limit: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Parameters for fetching tags
 */
export interface ListTagsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "name" | "popular" | "recent";
  order?: "asc" | "desc";
}

/**
 * Parameters for fetching quotes by tag
 */
export interface TagQuotesParams {
  slug: string;
  page?: number;
  limit?: number;
  sortBy?: "recent" | "popular" | "alphabetical";
}