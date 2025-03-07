import { NextResponse } from "next/server";
import { searchAnalyticsService } from "@/lib/services/search-analytics.service";
import type { SearchSuggestion } from "@/types/search";

// Interface for the suggestions API response
interface SuggestionsResponse {
  data?: {
    suggestions: SearchSuggestion[];
    popular?: SearchSuggestion[];
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * GET endpoint for search suggestions and auto-complete
 * 
 * Query parameters:
 * - q: The partial query to get suggestions for
 * - limit: Maximum number of suggestions to return (default: 5)
 * - includeTrending: Whether to include trending searches when q is empty (default: true)
 */
export async function GET(
  req: Request
): Promise<NextResponse<SuggestionsResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    
    // Extract query parameters
    const query = searchParams.get("q")?.trim() || "";
    const limit = Math.min(10, Math.max(1, Number(searchParams.get("limit")) || 5));
    const includeTrending = searchParams.get("includeTrending") !== "false";
    
    // Handle empty query - return popular searches
    if (!query && includeTrending) {
      const popularSearches = await searchAnalyticsService.getPopularSearches(limit);
      
      // Convert to suggestion format with scores
      const popular = popularSearches.map((search, index) => ({
        query: search.query,
        score: 1 - (index / popularSearches.length) // Score decreases with position
      }));
      
      return NextResponse.json({
        data: { 
          suggestions: [],
          popular
        }
      });
    }
    
    // For non-empty queries, get matching suggestions
    if (query) {
      const suggestions = await searchAnalyticsService.getSuggestions(query, limit);
      
      return NextResponse.json({
        data: { suggestions }
      });
    }
    
    // If we get here, just return empty results
    return NextResponse.json({
      data: { suggestions: [] }
    });
    
  } catch (error) {
    console.error("[SEARCH_SUGGESTIONS]", error);
    return NextResponse.json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch search suggestions"
      }
    }, { status: 500 });
  }
}