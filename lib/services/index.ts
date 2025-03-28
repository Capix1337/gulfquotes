// Export all services from this file

// Auth services
export * from "./auth/auth.service";
export * from "./auth/email.service";

// User services
export * from "./user/user.service";
export * from "./user/user-profile.service";

// Quote services
export * from "./quote/quote.service";
export { quoteLikeService } from "./like";
export { quoteBookmarkService } from "./bookmark";
export { quoteDisplayService } from "./public-quote/quote-display.service";
export { quoteCategoryService } from "./public-quote/quote-category.service";
export { quoteTagService } from "./public-quote/quote-tag.service";
export { quoteRelatedService } from "./public-quote/quote-related.service";
export { randomQuoteService } from "./public-quote/random-quote.service";

// Tag services
export { tagService } from "./tag/tag.service";

// Author services
export * from "./author/author-profile.service";
export { authorFollowService } from "./follow";

// Category services
export * from "./category/category.service";

// Gallery services
export * from "./gallery.service";

// Daily quote service
export * from "./daily-quote";

// Trending quote service
export * from "./trending-quote.service";

// Notification service
export * from "./notification/notification.service";

// Media service
export * from "./media.service";

// Analytics services
export * from "./analytics/analytics.service";