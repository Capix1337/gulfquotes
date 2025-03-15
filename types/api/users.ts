import { Prisma } from "@prisma/client";

// Update search params interface
export interface SearchParams {
  [key: string]: string | string[] | undefined;
}

// Base API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

// Quote-related types for user profiles
export interface ProfileQuote {
  id: string;
  content: string;
  slug: string;
  backgroundImage?: string | null;
  createdAt: string;
  category: {
    name: string;
    slug: string;
  };
  authorProfile: {
    name: string;
    slug: string;
    image?: string | null;
  };
}

// Comment-related types for user profiles
export interface ProfileComment {
  id: string;
  content: string;
  createdAt: string;
  quote: {
    id: string;
    content: string;
    slug: string;
  };
}

// Author follow type for user profiles
export interface ProfileFollowedAuthor {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  bio?: string | null;
  createdAt: string;
}

// Activity stats for user profiles
export interface ProfileActivityStats {
  quoteCount: number;
  likeCount: number;
  bookmarkCount: number;
  commentCount: number;
  followingCount: number;
  memberSince: string;
}

// Privacy settings for user profile
export interface ProfilePrivacySettings {
  showLikes: boolean;
  showBookmarks: boolean;
  showFollowing: boolean;
  showActivity: boolean;
}


export interface UserProfileData {
  username: string | null;
  bio: string | null;
  slug: string;
  quotes?: ProfileQuote[];
  likes?: ProfileQuote[];
  bookmarks?: ProfileQuote[];
  comments?: ProfileComment[];
  followedAuthors?: ProfileFollowedAuthor[];
  activityStats?: ProfileActivityStats;
  privacySettings?: ProfilePrivacySettings;
}

export interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  userProfile?: UserProfileData | null;
  isCurrentUser?: boolean;
}

export interface UsersListData {
  items: UserData[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

export type UsersResponse = ApiResponse<UsersListData>;

// Request Parameter Types
export interface UserFilterParams {
  search?: string;
}

export interface UserPaginationParams {
  page?: number;
  limit?: number;
}

// Include parameters for profile fetching
export interface UserProfileIncludeParams {
  quotes?: boolean;
  likes?: boolean;
  bookmarks?: boolean;
  comments?: boolean;
  followedAuthors?: boolean;
}

// Combined params type
export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string | undefined;
}

// Prisma Where Input Type
export type UserWhereInput = Prisma.UserWhereInput;

// Add these new types
export type UserErrorCode = 
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "INTERNAL_ERROR"
  | "TRANSACTION_ERROR"
  | "VALIDATION_ERROR";

export interface UserResponse extends ApiResponse<UserData> {
  error?: {
    code: UserErrorCode;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Profile update input type
export interface UpdateProfileInput {
  username?: string;
  bio?: string;
  name?: string;
  image?: string | null;
  privacySettings?: Partial<ProfilePrivacySettings>;
}

// Add new type for image upload result
export interface ProfileImageUploadResult {
  url: string;
  publicId: string;
  height: number;
  width: number;
  format: string;
}

// Settings update response
export interface SettingsResponse extends ApiResponse<UserData> {
  error?: {
    code: UserErrorCode;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface UpdateProfileData {
  username?: string;
  bio?: string;
  name?: string;
  image?: string | null;
  slug?: string;
  privacySettings?: Partial<ProfilePrivacySettings>;
}