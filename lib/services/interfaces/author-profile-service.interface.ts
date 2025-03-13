import { AuthorProfile } from "@prisma/client";
import { CreateAuthorProfileInput, UpdateAuthorProfileInput } from "@/schemas/author-profile";

export interface AuthorProfileListParams {
  page?: number;
  limit?: number;
  search?: string;
}

// New interface for birthday query parameters
export interface AuthorProfileBirthdayParams {
  day: number;
  month: number;
  page?: number;
  limit?: number;
}

export interface AuthorProfileListResponse {
  items: (AuthorProfile & {
    images?: {
      id: string;
      url: string;
    }[];
    _count?: {
      quotes: number;
    };
  })[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

// Extended author profile with date fields
export interface AuthorProfileWithDates extends AuthorProfile {
  // New structured date fields
  bornDay: number | null;
  bornMonth: number | null;
  bornYear: number | null;
  diedDay: number | null;
  diedMonth: number | null;
  diedYear: number | null;
  birthPlace: string | null;
  // External link fields
  externalLinkTitle: string | null;
  externalLinkUrl: string | null;
  // Additional fields that may be included
  images?: {
    id: string;
    url: string;
  }[];
  _count?: {
    quotes: number;
  };
}

export interface AuthorProfileService {
  create(data: CreateAuthorProfileInput): Promise<AuthorProfile>;
  update(id: string, data: UpdateAuthorProfileInput): Promise<AuthorProfile>;
  delete(id: string): Promise<AuthorProfile>;
  getById(id: string): Promise<AuthorProfileWithDates | null>;
  getBySlug(slug: string): Promise<AuthorProfileWithDates & { 
    images: { id: string; url: string; }[],
    _count: { quotes: number }
  }>;
  list(params: AuthorProfileListParams): Promise<AuthorProfileListResponse>;
  
  // New method for retrieving authors by birth day and month
  getAuthorsByBirthday(params: AuthorProfileBirthdayParams): Promise<AuthorProfileListResponse>;
  
  // Optional helper method for date fields
  formatDateFields?(authorProfile: AuthorProfileWithDates): {
    birthDate: string | null;
    deathDate: string | null;
  };
}