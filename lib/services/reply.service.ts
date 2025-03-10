// lib/services/reply.service.ts
import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
// import { auth } from "@/auth";
import type { User } from "next-auth";
import type { Reply} from "@prisma/client";
import { 
  CreateReplyInput,
  UpdateReplyInput 
} from "@/schemas/comment.schema";
import { replyLikeService } from "@/lib/services/like";

// Create an enhanced Reply interface that includes like status
interface ReplyWithLikeStatus extends Reply {
  isLiked?: boolean;
}

// Update the params interface to include userId
export interface ReplyListParams {
  commentId: string;
  page?: number;
  limit?: number;
  userId?: string; // Add this for like status
}

// Update the result interface to use the enhanced type
export interface ReplyListResult {
  items: ReplyWithLikeStatus[]; // Changed from Reply[]
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

/**
 * ReplyService handles business logic for reply operations
 */
class ReplyService {
  /**
   * Creates a new reply for a comment
   */
  async createReply(commentId: string, data: CreateReplyInput, user: User): Promise<Reply> {
    try {
      // Check if comment exists
      const comment = await db.comment.findUnique({
        where: { id: commentId },
        select: { id: true }
      });

      if (!comment) {
        throw new AppError("Comment not found", "NOT_FOUND", 404);
      }

      // Create the reply
      return await db.reply.create({
        data: {
          content: data.content,
          commentId,
          userId: user.id!, // Add non-null assertion operator
          likes: 0
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        }
      });
    } catch (error) {
      console.error("Error creating reply:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to create reply", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Gets a reply by ID
   */
  async getById(id: string): Promise<Reply | null> {
    try {
      return await db.reply.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        }
      });
    } catch (error) {
      console.error("Error getting reply:", error);
      throw new AppError("Failed to get reply", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Gets a reply with like status
   */
  async getReplyWithLikeStatus(id: string, userId: string): Promise<ReplyWithLikeStatus | null> {
    try {
      const reply = await this.getById(id);
      
      if (!reply) {
        return null;
      }
      
      const likeStatus = await replyLikeService.getUserLikes(userId, [id]);
      
      return {
        ...reply,
        isLiked: likeStatus[id] || false
      };
    } catch (error) {
      console.error("Error getting reply with like status:", error);
      throw new AppError("Failed to get reply with like status", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Lists replies for a comment with pagination and optional like status
   */
  async listReplies(params: ReplyListParams): Promise<ReplyListResult> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    try {
      // Check if comment exists
      const comment = await db.comment.findUnique({
        where: { id: params.commentId },
        select: { id: true }
      });

      if (!comment) {
        throw new AppError("Comment not found", "NOT_FOUND", 404);
      }

      const [items, total] = await Promise.all([
        db.reply.findMany({
          where: { commentId: params.commentId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: { createdAt: 'asc' },
          skip,
          take: limit
        }),
        db.reply.count({
          where: { commentId: params.commentId }
        })
      ]);

      // Add like status for all replies if userId is provided
      if (params.userId && items.length > 0) {
        const replyIds = items.map(reply => reply.id);
        const likeStatus = await replyLikeService.getUserLikes(params.userId, replyIds);
        
        // Merge like status into replies
        items.forEach(reply => {
          (reply as ReplyWithLikeStatus).isLiked = likeStatus[reply.id] || false;
        });
      }

      return {
        items,
        total,
        hasMore: total > skip + items.length,
        page,
        limit
      };
    } catch (error) {
      console.error("Error listing replies:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to list replies", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Updates a reply
   */
  async updateReply(id: string, data: UpdateReplyInput, userId: string, userRole?: string): Promise<Reply> {
    try {
      // Check if reply exists
      const reply = await db.reply.findUnique({
        where: { id },
        select: { id: true, userId: true }
      });

      if (!reply) {
        throw new AppError("Reply not found", "NOT_FOUND", 404);
      }

      // Check permission
      const isOwner = reply.userId === userId;
      const hasPermission = isOwner || userRole === "AUTHOR" || userRole === "ADMIN";
      
      if (!hasPermission) {
        throw new AppError("You don't have permission to update this reply", "FORBIDDEN", 403);
      }

      // Update reply
      return await db.reply.update({
        where: { id },
        data: {
          content: data.content,
          isEdited: true,
          editedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        }
      });
    } catch (error) {
      console.error("Error updating reply:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to update reply", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Deletes a reply
   */
  async deleteReply(id: string, userId: string, userRole?: string): Promise<Reply> {
    try {
      // Check if reply exists
      const reply = await db.reply.findUnique({
        where: { id },
        select: { id: true, userId: true }
      });

      if (!reply) {
        throw new AppError("Reply not found", "NOT_FOUND", 404);
      }

      // Check permission
      const isOwner = reply.userId === userId;
      const hasPermission = isOwner || userRole === "AUTHOR" || userRole === "ADMIN";
      
      if (!hasPermission) {
        throw new AppError("You don't have permission to delete this reply", "FORBIDDEN", 403);
      }

      // Delete reply
      return await db.reply.delete({
        where: { id }
      });
    } catch (error) {
      console.error("Error deleting reply:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to delete reply", "INTERNAL_ERROR", 500);
    }
  }
}

// Create and export singleton instance
const replyService = new ReplyService();
export default replyService;