import { AuthorProfile, Prisma } from "@prisma/client";
import {
  AuthorProfileService,
  AuthorProfileListParams,
  AuthorProfileListResponse,
  AuthorProfileWithDates,
  AuthorProfileBirthdayParams
} from "./interfaces/author-profile-service.interface";
import { CreateAuthorProfileInput, UpdateAuthorProfileInput } from "@/schemas/author-profile";
import { slugify, getMonthName } from "@/lib/utils";
import db from "@/lib/prisma";
import {
  AuthorProfileNotFoundError,
  DuplicateAuthorProfileError,
  ImageDeleteError,
  MaxImagesExceededError
} from "./errors/author-profile.errors";
import { deleteImage } from "@/lib/cloudinary";

class AuthorProfileServiceImpl implements AuthorProfileService {
  private readonly MAX_IMAGES = 5;

  private async validateSlug(slug: string, excludeId?: string): Promise<void> {
    const existing = await db.authorProfile.findFirst({
      where: {
        slug,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    if (existing) {
      throw new DuplicateAuthorProfileError("An author with similar name already exists");
    }
  }

  private async handleImageDeletion(imageId: string): Promise<void> {
    try {
      const image = await db.authorImage.findUnique({
        where: { id: imageId }
      });

      if (!image) return;

      // Delete from Cloudinary
      const success = await deleteImage(image.url);
      if (!success) {
        throw new ImageDeleteError();
      }

      // Delete from database
      await db.authorImage.delete({
        where: { id: imageId }
      });
    } catch {  // Remove the unused error parameter
      throw new ImageDeleteError();
    }
  }

  private async validateImagesCount(authorId: string, newImagesCount: number): Promise<void> {
    const currentImagesCount = await db.authorImage.count({
      where: { authorProfileId: authorId }
    });

    if (currentImagesCount + newImagesCount > this.MAX_IMAGES) {
      throw new MaxImagesExceededError();
    }
  }

  /**
   * Format date fields into readable strings
   */
  formatDateFields(authorProfile: AuthorProfileWithDates): {
    birthDate: string | null;
    deathDate: string | null;
  } {
    const birthDate = this.formatDate(
      authorProfile.bornDay,
      authorProfile.bornMonth,
      authorProfile.bornYear,
      authorProfile.birthPlace
    );
    
    const deathDate = this.formatDate(
      authorProfile.diedDay,
      authorProfile.diedMonth,
      authorProfile.diedYear
    );
    
    return { birthDate, deathDate };
  }

  /**
   * Helper to format individual date components into a string
   */
  private formatDate(
    day: number | null,
    month: number | null,
    year: number | null,
    location?: string | null
  ): string | null {
    if (!month && !day && !year) return null;
    
    const parts: string[] = [];

    // Add location if provided
    if (location) {
      parts.push(`Born in ${location}`);
    }
    
    // Format the date parts
    const dateParts: string[] = [];
    
    // Add month - Use the imported getMonthName instead of hardcoding
    if (month) {
      dateParts.push(getMonthName(month, true)); // true for capitalized month name
    }
    
    // Add day
    if (day) {
      dateParts.push(`${day}`);
    }
    
    // Add year
    if (year) {
      dateParts.push(`${year}`);
    }
    
    if (dateParts.length > 0) {
      // If we already have location, add a separator
      if (parts.length > 0) {
        parts.push('-');
      }
      parts.push(dateParts.join(' '));
    }
    
    return parts.length > 0 ? parts.join(' ') : null;
  }

  async create(data: CreateAuthorProfileInput): Promise<AuthorProfile> {
    try {
      const slug = data.slug || slugify(data.name);
      await this.validateSlug(slug);

      // Handle images if provided
      if (data.images && data.images.length > 0) {
        await this.validateImagesCount("", data.images.length);
      }

      return await db.$transaction(async (tx) => {
        // Create author profile with new date fields and external link fields
        const profile = await tx.authorProfile.create({
          data: {
            name: data.name,
            // Keep the original string fields for backward compatibility
            born: data.born,
            died: data.died,
            // Add new structured date fields
            bornDay: data.bornDay,
            bornMonth: data.bornMonth,
            bornYear: data.bornYear,
            diedDay: data.diedDay,
            diedMonth: data.diedMonth,
            diedYear: data.diedYear,
            birthPlace: data.birthPlace,
            influences: data.influences,
            bio: data.bio,
            // Add new external link fields
            externalLinkTitle: data.externalLinkTitle,
            externalLinkUrl: data.externalLinkUrl,
            slug,
          },
        });

        // Create images if provided
        if (data.images && data.images.length > 0) {
          await tx.authorImage.createMany({
            data: data.images.map((image) => ({
              url: image.url,
              authorProfileId: profile.id,
            })),
          });
        }

        return profile;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new DuplicateAuthorProfileError();
        }
      }
      throw error;
    }
  }

  async update(id: string, data: UpdateAuthorProfileInput): Promise<AuthorProfile> {
    try {
      const existing = await this.getById(id);
      if (!existing) {
        throw new AuthorProfileNotFoundError();
      }

      // Handle slug updates
      if (data.name || data.slug) {
        const newSlug = data.slug || (data.name ? slugify(data.name) : existing.slug);
        await this.validateSlug(newSlug, id);
        data.slug = newSlug;
      }

      // Handle image updates if provided
      if (data.images) {
        // Check if the images have actually changed by comparing URLs
        const existingImageUrls = existing.images?.map(img => img.url) || [];
        const newImageUrls = data.images.map(img => img.url);
        
        // Only validate and update images if they've changed
        if (JSON.stringify(existingImageUrls.sort()) !== JSON.stringify(newImageUrls?.sort() || [])) {
          // Now we know images have changed, so validate the new count
          await this.validateImagesCount(id, 0); // Just check if we're already at max
          
          return await db.$transaction(async (tx) => {
            // Update basic profile data
            const profile = await tx.authorProfile.update({
              where: { id },
              data: {
                name: data.name,
                born: data.born,
                died: data.died,
                bornDay: data.bornDay,
                bornMonth: data.bornMonth,
                bornYear: data.bornYear,
                diedDay: data.diedDay,
                diedMonth: data.diedMonth,
                diedYear: data.diedYear,
                birthPlace: data.birthPlace,
                influences: data.influences,
                bio: data.bio,
                // Add external link fields
                externalLinkTitle: data.externalLinkTitle,
                externalLinkUrl: data.externalLinkUrl,
                slug: data.slug,
              },
            });

            // Delete existing images
            await tx.authorImage.deleteMany({
              where: { authorProfileId: id }
            });

            // Create new images
            if (data.images && data.images.length > 0) {
              await tx.authorImage.createMany({
                data: data.images.map((image) => ({
                  url: image.url,
                  authorProfileId: id,
                })),
              });
            }

            return profile;
          });
        }
      }
      
      // If no image changes, just update the profile data
      return await db.authorProfile.update({
        where: { id },
        data: {
          name: data.name,
          born: data.born,
          died: data.died,
          bornDay: data.bornDay,
          bornMonth: data.bornMonth,
          bornYear: data.bornYear,
          diedDay: data.diedDay,
          diedMonth: data.diedMonth,
          diedYear: data.diedYear,
          birthPlace: data.birthPlace,
          influences: data.influences,
          bio: data.bio,
          // Add external link fields
          externalLinkTitle: data.externalLinkTitle,
          externalLinkUrl: data.externalLinkUrl,
          slug: data.slug,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AuthorProfileNotFoundError();
        }
      }
      throw error;
    }
  }

  async delete(id: string): Promise<AuthorProfile> {
    try {
      // Get all images before deletion
      const images = await db.authorImage.findMany({
        where: { authorProfileId: id }
      });

      // Delete the profile and its images from the database
      const deletedProfile = await db.$transaction(async (tx) => {
        await tx.authorImage.deleteMany({
          where: { authorProfileId: id }
        });

        return tx.authorProfile.delete({
          where: { id },
        });
      });

      // Delete images from Cloudinary after successful database deletion
      await Promise.all(
        images.map(image => this.handleImageDeletion(image.id))
      );

      return deletedProfile;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AuthorProfileNotFoundError();
        }
      }
      throw error;
    }
  }

  async getById(id: string): Promise<AuthorProfileWithDates | null> {
    return db.authorProfile.findUnique({
      where: { id },
      include: {
        images: {
          select: {
            id: true,
            url: true
          }
        }
      }
    }) as Promise<AuthorProfileWithDates | null>;
  }

  async getBySlug(slug: string): Promise<AuthorProfileWithDates & { 
    images: { id: string; url: string; }[],
    _count: { quotes: number }
  }> {
    const authorProfile = await db.authorProfile.findUnique({
      where: { 
        slug: decodeURIComponent(slug)
      },
      include: {
        images: {
          select: {
            id: true,
            url: true
          }
        },
        _count: {
          select: {
            quotes: true
          }
        }
      }
    });

    if (!authorProfile) {
      throw new AuthorProfileNotFoundError();
    }

    return authorProfile as AuthorProfileWithDates & { 
      images: { id: string; url: string; }[],
      _count: { quotes: number }
    };
  }

  async list(params: AuthorProfileListParams): Promise<AuthorProfileListResponse> {
    const { page = 1, limit = 10, search } = params;
    const skip = (page - 1) * limit;

    // Simpler where clause using string matching
    const whereCondition: Prisma.AuthorProfileWhereInput = search 
      ? {
          OR: [
            { name: { contains: search } },
            { bio: { contains: search } }
          ]
        }
      : {};

    const [items, total] = await Promise.all([
      db.authorProfile.findMany({
        where: whereCondition,
        include: {
          images: {
            select: {
              id: true,
              url: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.authorProfile.count({
        where: whereCondition
      })
    ]);

    return {
      items,
      total,
      page,
      limit,
      hasMore: (page * limit) < total
    };
  }

  async getAuthorsByBirthday(params: AuthorProfileBirthdayParams): Promise<AuthorProfileListResponse> {
    const { day, month, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    // Query condition to match authors with the specified birth day and month
    const whereCondition: Prisma.AuthorProfileWhereInput = {
      bornDay: day,
      bornMonth: month,
    };

    // Fetch authors and count in parallel
    const [items, total] = await Promise.all([
      db.authorProfile.findMany({
        where: whereCondition,
        include: {
          images: {
            select: {
              id: true,
              url: true
            }
          },
          _count: {
            select: {
              quotes: true
            }
          }
        },
        orderBy: [
          // Sort by birth year (ascending, oldest first)
          { bornYear: 'asc' },
          // Secondary sort by name for authors with the same year
          { name: 'asc' }
        ],
        skip,
        take: limit,
      }),
      db.authorProfile.count({
        where: whereCondition
      })
    ]);

    return {
      items,
      total,
      page,
      limit,
      hasMore: (page * limit) < total
    };
  }
}

export const authorProfileService = new AuthorProfileServiceImpl();