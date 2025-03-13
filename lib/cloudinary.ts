// lib/cloudinary.ts

import type { 
  CloudinaryUploadOptions,
  CloudinaryConfig 
} from '@/types/cloudinary';

// Check both required environment variables
if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
  throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not defined');
}

if (!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
  throw new Error('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is not defined');
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Now we can safely assert that these values are strings
export const cloudinaryConfig: CloudinaryConfig = {
  cloudName: CLOUD_NAME!,
  uploadPreset: UPLOAD_PRESET!,
  folders: {
    profiles: 'user-profiles',
    authors: 'author-profiles',
    quotes: 'quote-images',
    gallery: 'gallery-images',
  },
  limits: {
    maxFileSize: 7 * 1024 * 1024, // 7MB per file
    profiles: {
      maxFiles: 1,
      allowedFormats: ['jpg', 'jpeg', 'png', 'webp'] as const
    },
    authors: {
      maxFiles: 5,
      allowedFormats: ['jpg', 'jpeg', 'png', 'webp'] as const
    },
    quotes: {
      maxFiles: 30,
      allowedFormats: ['jpg', 'jpeg', 'png', 'webp'] as const
    },
    gallery: {
      maxFiles: 10, // Maximum files per upload operation
      allowedFormats: ['jpg', 'jpeg', 'png', 'webp'] as const
    }
  }
} as const;

// Helper function to get max files based on type
export function getMaxFiles(type: 'profiles' | 'authors' | 'quotes' | 'gallery'): number {
  return cloudinaryConfig.limits[type].maxFiles;
}

// Helper function to get folder based on type
export function getFolder(type: 'profiles' | 'authors' | 'quotes' | 'gallery'): string {
  return cloudinaryConfig.folders[type];
}

// Update the upload options interfaces
export const defaultUploadOptions: Partial<CloudinaryUploadOptions> = {
  maxFileSize: cloudinaryConfig.limits.maxFileSize,
  uploadPreset: UPLOAD_PRESET,
  sources: ['local', 'url', 'camera'], // Remove 'as const'
  clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp']
};

// Profile-specific upload options
export const profileUploadOptions: CloudinaryUploadOptions = {
  ...defaultUploadOptions,
  maxFiles: getMaxFiles('profiles'),
  folder: getFolder('profiles'),
  clientAllowedFormats: [...cloudinaryConfig.limits.profiles.allowedFormats],
  styles: {
    palette: {
      window: "#ffffff",
      sourceBg: "#f4f5f5",
      windowBorder: "#90a0b3",
      tabIcon: "#0078ff",
      inactiveTabIcon: "#0e2f5a",
      menuIcons: "#555a5f",
      link: "#0078ff",
      action: "#339933",
      inProgress: "#0078ff",
      complete: "#339933",
      error: "#cc0000",
      textDark: "#000000",
      textLight: "#fcfffd"
    }
  }
};

// Author-specific upload options
export const authorUploadOptions: CloudinaryUploadOptions = {
  ...defaultUploadOptions,
  maxFiles: getMaxFiles('authors'),
  folder: getFolder('authors'),
  clientAllowedFormats: [...cloudinaryConfig.limits.authors.allowedFormats],
} as const;

// Add quote-specific upload options
export const quoteUploadOptions: CloudinaryUploadOptions = {
  ...defaultUploadOptions,
  maxFiles: getMaxFiles('quotes'),
  folder: getFolder('quotes'),
  clientAllowedFormats: [...cloudinaryConfig.limits.quotes.allowedFormats],
  cropping: true,
  croppingAspectRatio: 1.91, // 1200:630 optimal for social sharing
  croppingShowDimensions: true,
  showAdvancedOptions: false,
} as const;

// Add gallery-specific upload options
export const galleryUploadOptions: CloudinaryUploadOptions = {
  ...defaultUploadOptions,
  maxFiles: getMaxFiles('gallery'), // 10 files per upload
  folder: getFolder('gallery'),
  clientAllowedFormats: [...cloudinaryConfig.limits.gallery.allowedFormats],
  showAdvancedOptions: false,
} as const;

export function buildImageUrl(publicId: string, transforms = imageTransforms.full) {
  const baseUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;
  const transformString = Object.entries(transforms)
    .map(([key, value]) => `${key}_${value}`)
    .join(',');

  return `${baseUrl}${transformString ? '/' + transformString : ''}/${publicId}`;
}

export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const origin = process.env.NEXTAUTH_URL || 
                  (typeof window !== 'undefined' ? window.location.origin : '');
    
    const imageUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${publicId}`;
    
    const response = await fetch(`${origin}/api/users/profile-image`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (response.status === 401) {
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      throw new Error("Failed to delete image");
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}

export function getImagePublicId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const publicIdWithExtension = pathParts[pathParts.length - 1];
    return publicIdWithExtension.split('.')[0];
  } catch {
    return null;
  }
}

// Add this type definition before the buildTransformationString function
export type CloudinaryTransformValue = string | number | boolean;

/**
 * Builds a Cloudinary transformation string from an options object
 */
export function buildTransformationString(options: Record<string, CloudinaryTransformValue>): string {
  return Object.entries(options)
    .map(([key, value]) => `${key}_${value}`)
    .join(',');
}

// Author avatar transformation presets
export const authorAvatarTransforms = {
  // Small avatar for lists and comments
  small: {
    width: 48,
    height: 48,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto'
  },
  
  // Medium avatar for cards and profile previews
  medium: {
    width: 200,
    height: 200,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetchFormat: 'auto'
  },
  
  // Large avatar for profile page headers
  large: {
    width: 400,
    height: 400,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetchFormat: 'auto'
  }
};

export const imageTransforms = {
  thumbnail: {
    width: 100,
    height: 100,
    crop: 'fill',
    quality: 'auto',
    format: 'webp',
  },
  preview: {
    width: 300,
    height: 300,
    crop: 'fill',
    quality: 'auto',
    format: 'webp',
  },
  full: {
    width: 1024,
    crop: 'scale',
    quality: 'auto',
    format: 'webp',
  },
  profile: {
    thumbnail: {
      width: 64,
      height: 64,
      crop: 'thumb',
      gravity: 'face',
      format: 'webp',
      quality: 'auto',
    },
    display: {
      width: 150,
      height: 150,
      crop: 'thumb',
      gravity: 'face',
      format: 'webp',
      quality: 'auto',
    },
    large: {
      width: 300,
      height: 300,
      crop: 'thumb',
      gravity: 'face',
      format: 'webp',
      quality: 'auto',
    }
  },
  quote: {
    thumbnail: {
      width: 150,
      height: 150,
      crop: 'fill',
      quality: 'auto',
      format: 'webp',
    },
    preview: {
      width: 400,
      height: 400,
      crop: 'fill',
      quality: 'auto',
      format: 'webp',
    },
    social: {
      width: 1200,
      height: 630,
      crop: 'fill',
      quality: 'auto',
      format: 'webp',
    }
  },
  authorAvatars: {
    small: buildTransformationString(authorAvatarTransforms.small),
    medium: buildTransformationString(authorAvatarTransforms.medium),
    large: buildTransformationString(authorAvatarTransforms.large)
  }
} as const;