import { z } from "zod";
import type { Tag } from "@prisma/client";
import type { GalleryItem } from "@/types/gallery";
import type { Gallery } from "@prisma/client";

// Base Quote Schema
export const quoteSchema = z.object({
  id: z.string(),
  content: z.string().min(1, "Quote content is required"),
  slug: z.string(),  // The slug generated or provided
  authorId: z.string(),
  categoryId: z.string(),
  authorProfileId: z.string(), // Add this field
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Gallery image schema
const galleryImageSchema = z.object({
  galleryId: z.string(),
  isActive: z.boolean().optional(),
  isBackground: z.boolean().optional(),
});

// Split into two schemas - one for form, one for API
export const createQuoteFormSchema = z.object({
  content: z.string().min(1).max(1500),
  categoryId: z.string().min(1),
  authorProfileId: z.string().min(1),
  slug: z.string().optional(),
  backgroundImage: z.string().nullable().optional(),
  featured: z.boolean().default(false).optional(), // Add this line
  // No tags here - we'll handle them separately
});

// Schema for the API payload
export const createQuoteAPISchema = createQuoteFormSchema.extend({
  tags: z.object({
    connect: z.array(z.object({
      id: z.string()
    }))
  }).optional(),
  gallery: z.object({
    create: z.array(galleryImageSchema)
  }).optional(),
});

// Update the updateQuoteSchema with specific edit validations
export const updateQuoteSchema = z.object({
  content: z.string()
    .min(1, "Quote content is required")
    .max(1500, "Quote must not exceed 1500 characters")
    .optional(),
  slug: z.string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format")
    .optional(),
  categoryId: z.string()
    .min(1, "Category is required")
    .optional(),
  authorProfileId: z.string()
    .min(1, "Author profile is required")
    .optional(),
  featured: z.boolean().optional(), // Add this line
  backgroundImage: z.string().url().nullable().optional(),
  galleryImages: z.array(z.object({
    id: z.string(),
    isActive: z.boolean(),
    isBackground: z.boolean()
  })).optional(),
  tags: z.object({
    connect: z.array(z.object({ id: z.string() })).optional(),
    disconnect: z.array(z.object({ id: z.string() })).optional()
  }).optional()
});

// Add a schema for edit response validation
export const editQuoteResponseSchema = quoteSchema.extend({
  updatedAt: z.date(),
  previousVersion: quoteSchema.optional(),
});

// TypeScript Types
export type Quote = z.infer<typeof quoteSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteAPISchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;
export type EditQuoteResponse = z.infer<typeof editQuoteResponseSchema>;

// In types/quote.ts
export interface QuoteFormData {
  content: string;
  slug?: string;
  categoryId: string;
  authorProfileId: string;
  backgroundImage?: string | null;
  galleryImages?: GalleryItem[];
  tags?: Tag[]; // Simple Tag array for form state
}

export interface BackgroundImage extends Gallery {
  isActive: boolean;
  isBackground: boolean;
}

export interface QuoteBackground {
  gallery: Gallery;
  isActive: boolean;
  isBackground: boolean;
}

export interface QuoteBackgroundOptions {
  style?: 'dark' | 'light' | 'gradient' | 'transparent';
  opacity?: number;
  blur?: number;
}