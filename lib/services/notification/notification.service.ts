// lib/services/notification/notification.service.ts
import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
import { Notification, NotificationType, Prisma } from "@prisma/client";
import EmailNotificationService from './email-notification.service';

// Define input types for creating notifications
export interface CreateNotificationInput {
  type: NotificationType;
  title?: string;
  message: string;
  userId: string;
  quoteId?: string;
  authorProfileId?: string;
  actorId?: string;
}

// Define response types
export interface NotificationListResult {
  items: Notification[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

interface FollowerWithEmailPreferences {
  id: string;
  userId: string;
  authorProfileId: string;
  createdAt: Date;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    emailNotifications: boolean;
    emailNotificationTypes: NotificationType[];
  } | null;
}

/**
 * NotificationService handles business logic for notification operations
 */
class NotificationServiceImpl {
  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationInput): Promise<Notification> {
    try {
      return await db.notification.create({
        data: {
          type: data.type,
          title: data.title,
          message: data.message,
          userId: data.userId,
          quoteId: data.quoteId,
          authorProfileId: data.authorProfileId,
          actorId: data.actorId,
          read: false
        }
      });
    } catch (error) {
      console.error("Error creating notification:", error);
      throw new AppError("Failed to create notification", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Create notifications for followers when an author posts a quote
   * The in-app notifications are created synchronously
   * Email notifications are processed asynchronously
   */
  async createQuoteNotificationsForFollowers(
    authorProfileId: string, 
    quoteId: string, 
    authorId: string,
    authorName: string
  ): Promise<void> {
    try {
      // Find users who follow this author
      const followers = await db.authorFollow.findMany({
        where: { authorProfileId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              emailNotifications: true,
              emailNotificationTypes: true
            }
          }
        }
      });
      
      if (followers.length === 0) return;
      
      // Create in-app notifications for each follower - this remains synchronous
      const notifications = followers.map(follower => ({
        type: NotificationType.NEW_QUOTE,
        title: "New Quote Posted",
        message: `${authorName} has posted a new quote`,
        userId: follower.userId,
        quoteId,
        authorProfileId,
        actorId: authorId,
        read: false
      }));
      
      // Save in-app notifications (keep this synchronous as it's fast)
      await db.notification.createMany({
        data: notifications
      });
      
      // Process email notifications asynchronously (fire and forget)
      // This is where the async magic happens - we don't await this!
      this.processEmailNotificationsAsync(followers, quoteId, authorProfileId, authorName);
      
    } catch (error) {
      console.error("Error creating follower notifications:", error);
      throw new AppError("Failed to create follower notifications", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Process email notifications asynchronously
   * This method is called but not awaited, allowing it to run in the background
   */
  private async processEmailNotificationsAsync(
    followers: FollowerWithEmailPreferences[], 
    quoteId: string, 
    authorProfileId: string, 
    authorName: string
  ): Promise<void> {
    try {
      // Get author slug for emails
      const author = await db.authorProfile.findUnique({
        where: { id: authorProfileId },
        select: { slug: true }
      });
      
      if (!author) return;

      // Sanitize author name for email tags
      const sanitizedAuthorName = authorName.replace(/[^a-zA-Z0-9_-]/g, '_');
      
      // Process email notifications
      const { sent, skipped } = await EmailNotificationService.processBatchEmails(
        followers,
        quoteId,
        authorProfileId,
        sanitizedAuthorName,
        author.slug
      );
      
      console.log(`[Background] Email notifications: ${sent} sent, ${skipped} skipped`);
    } catch (error) {
      // Since this runs asynchronously, we just log errors rather than throwing them
      console.error("[Background] Error processing email notifications:", error);
    }
  }

  /**
   * Get notifications for a user with pagination
   */
  async getUserNotifications(
    userId: string, 
    { page = 1, limit = 10, includeRead = true, onlyRead = false }
  ): Promise<NotificationListResult> {
    try {
      const skip = (page - 1) * limit;
      
      // Build where condition
      const whereCondition: Prisma.NotificationWhereInput = { userId };
      
      // Apply read filters
      if (!includeRead) {
        // Only show unread
        whereCondition.read = false;
      } else if (onlyRead) {
        // Only show read
        whereCondition.read = true;
      }
      
      // Get notifications and counts
      const [items, total, unreadCount] = await Promise.all([
        db.notification.findMany({
          where: whereCondition,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            actor: {
              select: {
                id: true,
                name: true,
                image: true
              }
            },
            quote: {
              select: {
                id: true,
                slug: true,
                content: true
              }
            },
            authorProfile: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }),
        db.notification.count({ where: whereCondition }),
        db.notification.count({
          where: {
            userId,
            read: false
          }
        })
      ]);
      
      return {
        items,
        total,
        unreadCount,
        hasMore: total > skip + items.length,
        page,
        limit
      };
    } catch (error) {
      console.error("Error getting user notifications:", error);
      throw new AppError("Failed to get user notifications", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await db.notification.count({
        where: {
          userId,
          read: false
        }
      });
    } catch (error) {
      console.error("Error getting unread notification count:", error);
      throw new AppError("Failed to get unread notification count", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    try {
      const notification = await db.notification.findUnique({
        where: { id }
      });
      
      if (!notification) {
        throw new AppError("Notification not found", "NOT_FOUND", 404);
      }
      
      // Make sure the notification belongs to the user
      if (notification.userId !== userId) {
        throw new AppError("You don't have permission to update this notification", "FORBIDDEN", 403);
      }
      
      return await db.notification.update({
        where: { id },
        data: { read: true }
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to mark notification as read", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Mark all notifications for a user as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await db.notification.updateMany({
        where: {
          userId,
          read: false
        },
        data: { read: true }
      });
      
      return result.count;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw new AppError("Failed to mark all notifications as read", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string, userId: string): Promise<void> {
    try {
      const notification = await db.notification.findUnique({
        where: { id }
      });
      
      if (!notification) {
        throw new AppError("Notification not found", "NOT_FOUND", 404);
      }
      
      // Make sure the notification belongs to the user
      if (notification.userId !== userId) {
        throw new AppError("You don't have permission to delete this notification", "FORBIDDEN", 403);
      }
      
      await db.notification.delete({
        where: { id }
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to delete notification", "INTERNAL_ERROR", 500);
    }
  }
}

export const notificationService = new NotificationServiceImpl();
export default notificationService;