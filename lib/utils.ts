import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')    // Remove special characters
    .replace(/[\s_-]+/g, '-')    // Replace spaces and underscore with hyphen
    .replace(/^-+|-+$/g, '');    // Remove leading/trailing hyphen
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}

// Interface for user slug generation
interface GenerateUserSlugParams {
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  userId: string;  // This must be required and non-null
}

export function generateUserSlug(params: GenerateUserSlugParams): string {
  const { username, firstName, lastName, userId } = params;
  
  // Priority 1: Username
  if (username) {
    return slugify(username);
  }
  
  // Priority 2: First name and last name
  if (firstName && lastName) {
    const nameSlug = slugify(`${firstName}-${lastName}`);
    const randomStr = Math.random().toString(36).substring(2, 7);
    return `${nameSlug}-${randomStr}`;
  }
  
  // Priority 3: Fallback to userId
  return userId;
}

// Re-export date utils for backward compatibility
export * from './date-utils';

// Add these new utility functions to the existing utils.ts file

// Month name mapping
export const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

// Month name mapping (capitalized)
export const MONTH_NAMES_CAPITALIZED = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Convert numeric month to month name
 */
export function getMonthName(month: number, capitalized = false): string {
  // Check if month is valid (1-12)
  if (month < 1 || month > 12) {
    throw new Error('Invalid month number. Month must be between 1 and 12.');
  }
  
  return capitalized 
    ? MONTH_NAMES_CAPITALIZED[month - 1] 
    : MONTH_NAMES[month - 1];
}

/**
 * Convert month name to numeric month
 */
export function getMonthNumber(monthName: string): number {
  const index = MONTH_NAMES.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
  
  if (index === -1) {
    throw new Error(`Invalid month name: ${monthName}`);
  }
  
  return index + 1; // Add 1 as months are 1-indexed
}

/**
 * Generate a URL path for birthday pages
 */
export function generateBirthdayPath(day: number, month: number | string): string {
  const monthStr = typeof month === 'number' 
    ? getMonthName(month) 
    : month.toLowerCase();
  
  return `/birthdays/${monthStr}_${day}`;
}

/**
 * Format a birthdate with day, month, and optional year
 */
export function formatBirthdate(day: number, month: number, year?: number | null): string {
  const monthName = getMonthName(month, true);
  
  if (year) {
    return `${monthName} ${day}, ${year}`;
  }
  
  return `${monthName} ${day}`;
}

/**
 * Creates an absolute URL from a relative path using the APP_URL from environment variables
 * @param path - The relative path to convert to an absolute URL
 */
export function absoluteUrl(path: string): string {
  // Use environment variable for the base URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  // Remove trailing slash from baseUrl if present
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  // Add leading slash to path if not present
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${normalizedBaseUrl}${normalizedPath}`;
}