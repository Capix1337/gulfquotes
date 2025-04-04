// app/api/quotes/[slug]/like/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { quoteService } from "@/lib/services/quote/quote.service";
import { quoteLikeService } from "@/lib/services/like";
import { AppError } from "@/lib/api-error";
import type { QuoteErrorCode } from "@/types/api/quotes";

interface LikeResponse {
  data?: {
    liked: boolean;
    likes: number;
  };
  error?: {
    code: QuoteErrorCode;
    message: string;
  };
}

/**
 * POST handler for toggling like status on a quote
 */
export async function POST(req: Request): Promise<NextResponse<LikeResponse>> {
  try {
    // Authentication is required for liking
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED" as QuoteErrorCode, message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Extract slug from URL
    const slug = req.url.split('/quotes/')[1]?.split('/')[0];
    if (!slug) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST" as QuoteErrorCode, message: "Invalid quote slug" } },
        { status: 400 }
      );
    }

    // Get the quote by slug
    const quote = await quoteService.getBySlug(slug);
    if (!quote) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND" as QuoteErrorCode, message: "Quote not found" } },
        { status: 404 }
      );
    }

    // Toggle like
    const result = await quoteLikeService.toggleLike(quote.id, session.user.id);

    return NextResponse.json({
      data: result
    });

  } catch (error) {
    console.error("[QUOTE_LIKE_TOGGLE]", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code as QuoteErrorCode, message: error.message } },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR" as QuoteErrorCode, message: "Failed to process like action" } },
      { status: 500 }
    );
  }
}

/**
 * GET handler for checking like status on a quote
 */
export async function GET(req: Request): Promise<NextResponse<LikeResponse>> {
  try {
    // Authentication is required for checking like status
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED" as QuoteErrorCode, message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Extract slug from URL
    const slug = req.url.split('/quotes/')[1]?.split('/')[0];
    if (!slug) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST" as QuoteErrorCode, message: "Invalid quote slug" } },
        { status: 400 }
      );
    }

    // Get the quote by slug
    const quote = await quoteService.getBySlug(slug);
    if (!quote) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND" as QuoteErrorCode, message: "Quote not found" } },
        { status: 404 }
      );
    }

    // Get the like status for this user and quote
    const likeStatus = await quoteLikeService.getUserLikes(session.user.id, [quote.id]);
    
    // Get the total like count
    const likeCount = await quoteLikeService.getLikeCount(quote.id);
    
    return NextResponse.json({
      data: {
        liked: likeStatus[quote.id] || false,
        likes: likeCount
      }
    });
  } catch (error) {
    // Error handling
    console.error("[QUOTE_LIKE_STATUS]", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code as QuoteErrorCode, message: error.message } },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR" as QuoteErrorCode, message: "Failed to get like status" } },
      { status: 500 }
    );
  }
}