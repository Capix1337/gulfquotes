import { z } from "zod";

export const authorImageSchema = z.object({
  id: z.string(),
  url: z.string().url("Invalid image URL"),
});

// Helper function for date field validation
const daysByMonth = (month?: number, year?: number): number => {
  if (!month) return 31; // Default max days
  
  // April, June, September, November have 30 days
  if ([4, 6, 9, 11].includes(month)) return 30;
  
  // February - check for leap year
  if (month === 2) {
    // If year is provided, check for leap year
    if (year) {
      return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 29 : 28;
    }
    return 29; // If no year provided, allow up to 29 for leap years
  }
  
  // All other months have 31 days
  return 31;
};

// Create a base schema without refinements
const baseSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  bio: z.string().min(1, "Biography is required").max(2000),
  // Keep existing string fields for backward compatibility
  born: z.string().nullable().optional(),
  died: z.string().nullable().optional(),
  // Add new structured date fields
  bornDay: z.number().int().min(1, "Day must be at least 1")
    .max(31, "Day cannot exceed 31")
    .nullable().optional(),
  bornMonth: z.number().int().min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12")
    .nullable().optional(),
  bornYear: z.number().int().min(1, "Year must be positive")
    .nullable().optional(),
  diedDay: z.number().int().min(1, "Day must be at least 1")
    .max(31, "Day cannot exceed 31")
    .nullable().optional(),
  diedMonth: z.number().int().min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12")
    .nullable().optional(),
  diedYear: z.number().int().min(1, "Year must be positive")
    .nullable().optional(),
  birthPlace: z.string().nullable().optional(),
  influences: z.string().nullable().optional(),
  // Add external link fields
  externalLinkTitle: z.string().nullable().optional(),
  externalLinkUrl: z.string().url("Invalid URL format").nullable().optional(),
  slug: z.string().optional(),
  images: z.array(authorImageSchema).default([]),
});

// Add the refinements to create the complete schema
export const authorProfileBaseSchema = baseSchema
  .refine((data) => {
    // Validate that bornDay is valid for the given bornMonth and bornYear
    if (data.bornDay && data.bornMonth) {
      const maxDays = daysByMonth(data.bornMonth, data.bornYear || undefined);
      if (data.bornDay > maxDays) {
        return false;
      }
    }
    return true;
  }, {
    message: "Invalid birth day for the selected month and year",
    path: ["bornDay"]
  })
  .refine((data) => {
    // Validate that diedDay is valid for the given diedMonth and diedYear
    if (data.diedDay && data.diedMonth) {
      const maxDays = daysByMonth(data.diedMonth, data.diedYear || undefined);
      if (data.diedDay > maxDays) {
        return false;
      }
    }
    return true;
  }, {
    message: "Invalid death day for the selected month and year",
    path: ["diedDay"]
  })
  .refine((data) => {
    // Validate that death date is after birth date if both are provided
    if (data.bornYear && data.diedYear) {
      // Compare years first
      if (data.diedYear < data.bornYear) {
        return false;
      }
      
      // If same year, compare months
      if (data.diedYear === data.bornYear && data.bornMonth && data.diedMonth) {
        if (data.diedMonth < data.bornMonth) {
          return false;
        }
        
        // If same month, compare days
        if (data.diedMonth === data.bornMonth && data.bornDay && data.diedDay) {
          if (data.diedDay < data.bornDay) {
            return false;
          }
        }
      }
    }
    return true;
  }, {
    message: "Death date must be after birth date",
    path: ["diedYear"]
  })
  // Add the new refinement for external links
  .refine((data) => {
    // If one external link field is provided, the other must also be provided
    if ((data.externalLinkTitle && !data.externalLinkUrl) || 
        (!data.externalLinkTitle && data.externalLinkUrl)) {
      return false;
    }
    return true;
  }, {
    message: "Both external link title and URL must be provided together",
    path: ["externalLinkTitle"] // This indicates which field the error is associated with
  });

// Schema for creating a new author profile
export const createAuthorProfileSchema = authorProfileBaseSchema;

// Schema for updating an existing author profile
// Use baseSchema.partial() first, then add the refinements
export const updateAuthorProfileSchema = baseSchema
  .partial() // Make all fields optional for updates
  .refine((data: Record<string, unknown>) => {
    // Ensure at least one field is present in update
    return Object.keys(data).length > 0;
  }, {
    message: "At least one field must be provided for update",
  })
  .refine((data) => {
    // Validate that bornDay is valid for the given bornMonth and bornYear
    if (data.bornDay && data.bornMonth) {
      const maxDays = daysByMonth(data.bornMonth, data.bornYear || undefined);
      if (data.bornDay > maxDays) {
        return false;
      }
    }
    return true;
  }, {
    message: "Invalid birth day for the selected month and year",
    path: ["bornDay"]
  })
  .refine((data) => {
    // Validate that diedDay is valid for the given diedMonth and diedYear
    if (data.diedDay && data.diedMonth) {
      const maxDays = daysByMonth(data.diedMonth, data.diedYear || undefined);
      if (data.diedDay > maxDays) {
        return false;
      }
    }
    return true;
  }, {
    message: "Invalid death day for the selected month and year",
    path: ["diedDay"]
  })
  .refine((data) => {
    // Validate that death date is after birth date if both are provided
    if (data.bornYear && data.diedYear) {
      // Compare years first
      if (data.diedYear < data.bornYear) {
        return false;
      }
      
      // If same year, compare months
      if (data.diedYear === data.bornYear && data.bornMonth && data.diedMonth) {
        if (data.diedMonth < data.bornMonth) {
          return false;
        }
        
        // If same month, compare days
        if (data.diedMonth === data.bornMonth && data.bornDay && data.diedDay) {
          if (data.diedDay < data.bornDay) {
            return false;
          }
        }
      }
    }
    return true;
  }, {
    message: "Death date must be after birth date",
    path: ["diedYear"]
  });

// TypeScript Types
export type CreateAuthorProfileInput = z.infer<typeof authorProfileBaseSchema>;
export type UpdateAuthorProfileInput = z.infer<typeof updateAuthorProfileSchema>;

// Custom validator for influences
export const validateInfluences = (influences: string): string[] => {
  if (!influences) return [];
  // Split by comma and trim whitespace
  return influences
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);
};