// lib/utils/image-management.ts

import { AppError } from "@/lib/api-error";
import { cloudinaryConfig, imageTransforms } from "@/lib/cloudinary";
import type { CloudinaryResource, QuoteImageResource } from "@/types/cloudinary";

interface ImageTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'scale' | 'thumb';
  quality?: 'auto' | string;
  format?: 'webp' | 'jpg' | 'png';
  gravity?: 'face' | 'center';
  aspectRatio?: number;
}

/**
 * Build a Cloudinary URL with transformations
 */
export function buildImageUrl(publicId: string, options: ImageTransformOptions = {}): string {
  const baseUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload`;
  const transformations = Object.entries(options)
    .filter(([, value]) => value !== undefined) // Remove underscore, use just comma
    .map(([key, value]) => `${key}_${value}`)
    .join(',');

  return `${baseUrl}${transformations ? '/' + transformations : ''}/${publicId}`;
}

/**
 * Get optimized quote image URLs for different contexts
 */
export function getQuoteImageUrls(image: QuoteImageResource) {
  return {
    thumbnail: buildImageUrl(image.public_id, imageTransforms.quote.thumbnail),
    preview: buildImageUrl(image.public_id, imageTransforms.quote.preview),
    social: buildImageUrl(image.public_id, imageTransforms.quote.social),
    original: image.secure_url
  };
}

/**
 * Validate image dimensions
 */
export function validateImageDimensions(
  image: CloudinaryResource,
  { minWidth = 0, minHeight = 0, maxWidth = Infinity, maxHeight = Infinity }
): boolean {
  return (
    image.width >= minWidth &&
    image.height >= minHeight &&
    image.width <= maxWidth &&
    image.height <= maxHeight
  );
}

/**
 * Calculate optimal image dimensions maintaining aspect ratio
 */
export function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio)
  };
}

/**
 * Generate responsive image srcSet
 */
export function generateImageSrcSet(publicId: string, breakpoints: number[] = [320, 640, 768, 1024, 1280]): string {
  return breakpoints
    .map(width => {
      const url = buildImageUrl(publicId, { width, quality: 'auto', format: 'webp' });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Calculate social media image dimensions
 */
export function getSocialImageDimensions(platform: 'twitter' | 'facebook' | 'linkedin' = 'twitter'): {
  width: number;
  height: number;
  aspectRatio: number;
} {
  const dimensions = {
    twitter: { width: 1200, height: 630, aspectRatio: 1.91 },
    facebook: { width: 1200, height: 630, aspectRatio: 1.91 },
    linkedin: { width: 1200, height: 627, aspectRatio: 1.91 }
  };

  return dimensions[platform];
}

/**
 * Transform quote text to fit image
 */
export function formatQuoteText(
  text: string,
  maxLength: number = 180,
  options: { ellipsis?: boolean } = {}
): string {
  if (text.length <= maxLength) return text;
  
  return options.ellipsis 
    ? `${text.slice(0, maxLength - 3)}...`
    : text.slice(0, maxLength);
}

/**
 * Get image size category
 */
export function getImageSizeCategory(fileSize: number): 'small' | 'medium' | 'large' {
  const MB = 1024 * 1024;
  if (fileSize <= MB) return 'small';
  if (fileSize <= 5 * MB) return 'medium';
  return 'large';
}

// Add new validation functions
export function validateImageFormat(format: string): boolean {
  return cloudinaryConfig.limits.quotes.allowedFormats.includes(format.toLowerCase());
}

export function validateImageSize(bytes: number): boolean {
  return bytes <= cloudinaryConfig.limits.maxFileSize;
}

export function validateQuoteImage(image: CloudinaryResource): void {
  // Validate format
  if (!validateImageFormat(image.format)) {
    throw new AppError(
      `Invalid image format. Allowed formats: ${cloudinaryConfig.limits.quotes.allowedFormats.join(', ')}`,
      "INVALID_IMAGE_FORMAT",
      400
    );
  }

  // Validate file size
  if (!validateImageSize(image.bytes)) {
    throw new AppError(
      `Image size exceeds maximum allowed size of ${cloudinaryConfig.limits.maxFileSize / (1024 * 1024)}MB`,
      "INVALID_IMAGE_SIZE",
      400
    );
  }

  // Validate dimensions for social sharing
  const minDimensions = {
    minWidth: 1200,
    minHeight: 630
  };

  if (!validateImageDimensions(image, minDimensions)) {
    throw new AppError(
      `Image dimensions must be at least ${minDimensions.minWidth}x${minDimensions.minHeight} pixels`,
      "INVALID_IMAGE_DIMENSIONS",
      400
    );
  }
}

// Add batch validation function
export function validateQuoteImages(images: QuoteImageResource[]): void {
  // Check maximum limit
  if (images.length > cloudinaryConfig.limits.quotes.maxFiles) {
    throw new AppError(
      `Maximum ${cloudinaryConfig.limits.quotes.maxFiles} images allowed`,
      "MAX_IMAGES_EXCEEDED",
      400
    );
  }

  // Validate each image
  images.forEach(image => {
    validateQuoteImage(image);
  });
}

// Add function to handle failed uploads
export function handleUploadError(error: unknown): never {
  if (error instanceof AppError) throw error;

  const message = error instanceof Error ? error.message : "Failed to upload image";
  throw new AppError(message, "IMAGE_UPLOAD_FAILED", 500);
}

// Add function to handle failed deletions
export function handleDeleteError(error: unknown): never {
  if (error instanceof AppError) throw error;

  const message = error instanceof Error ? error.message : "Failed to delete image";
  throw new AppError(message, "IMAGE_DELETE_FAILED", 500);
}

/**
 * Get an optimized author avatar URL with proper square cropping
 * @param imageUrl The original image URL
 * @param size The size of the avatar (both width and height)
 * @returns Transformed URL for optimal avatar display
 */
export function getAuthorAvatarUrl(imageUrl: string | null | undefined, size: number = 200): string {
  if (!imageUrl) return "";
  
  // Check if it's a Cloudinary URL
  if (imageUrl.includes(`cloudinary.com/${cloudinaryConfig.cloudName}`)) {
    // Extract the public ID from the URL
    // This assumes the URL format follows Cloudinary's standard pattern
    const regex = /\/upload\/(?:v\d+\/)?([^/]+)(?:\.\w+)?$/;
    const match = imageUrl.match(regex);
    const publicId = match ? match[1] : null;
    
    if (publicId) {
      // Apply avatar-specific transformations
      return buildImageUrl(publicId, {
        width: size,
        height: size,
        crop: 'fill',
        gravity: 'face',
        quality: 'auto'
      });
    }
  }
  
  // Return original URL for non-Cloudinary images or if extraction fails
  return imageUrl;
}