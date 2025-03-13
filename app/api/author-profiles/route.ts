// File: app/api/author-profiles/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createAuthorProfileSchema } from "@/schemas/author-profile";
import { authorProfileService } from "@/lib/services/author-profile.service";
import type { AuthorProfileResponse, AuthorProfilesResponse } from "@/types/api/author-profiles";
import { DuplicateAuthorProfileError, MaxImagesExceededError } from "@/lib/services/errors/author-profile.errors";
import { cloudinaryConfig, getMaxFiles } from "@/lib/cloudinary";
import { AuthorProfileWithDates } from "@/lib/services/interfaces/author-profile-service.interface";
import { AuthorProfile } from "@prisma/client";

// GET handler for listing author profiles
export async function GET(req: Request): Promise<NextResponse<AuthorProfilesResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    
    // Extract pagination parameters
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || undefined;

    const result = await authorProfileService.list({
      page,
      limit,
      search
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[AUTHOR_PROFILES_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// POST handler for creating new author profiles
export async function POST(req: Request): Promise<NextResponse<AuthorProfileResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 }
      );
    }

    // Only admin can create author profiles
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Permission denied" } },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = createAuthorProfileSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { 
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: validatedData.error.flatten().fieldErrors
          }
        },
        { status: 400 }
      );
    }

    // Validate images if present
    if (validatedData.data.images && validatedData.data.images.length > 0) {
      // Check maximum number of images using helper function
      if (validatedData.data.images.length > getMaxFiles('authors')) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: `Maximum ${getMaxFiles('authors')} images allowed`,
            }
          },
          { status: 400 }
        );
      }

      // Verify cloudinary configuration
      if (!cloudinaryConfig.cloudName) {
        return NextResponse.json(
          {
            error: {
              code: "CONFIGURATION_ERROR",
              message: "Cloudinary configuration is missing",
            }
          },
          { status: 500 }
        );
      }

      // Validate each image URL
      for (const image of validatedData.data.images) {
        if (!image.url.includes(cloudinaryConfig.cloudName)) {
          return NextResponse.json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: "Invalid image URL. Images must be uploaded to Cloudinary",
              }
            },
            { status: 400 }
          );
        }
      }
    }

    // Handle date field validation - additional custom validations beyond the schema
    if (validatedData.data.bornDay || validatedData.data.bornMonth || validatedData.data.bornYear) {
      // Check that if any birth date component is provided, all necessary ones are provided
      if (validatedData.data.bornMonth && !validatedData.data.bornYear) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Birth year must be provided when month is specified"
            }
          },
          { status: 400 }
        );
      }
      
      if (validatedData.data.bornDay && !validatedData.data.bornMonth) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Birth month must be provided when day is specified"
            }
          },
          { status: 400 }
        );
      }
    }

    // Similar validation for death date fields
    if (validatedData.data.diedDay || validatedData.data.diedMonth || validatedData.data.diedYear) {
      if (validatedData.data.diedMonth && !validatedData.data.diedYear) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Death year must be provided when month is specified"
            }
          },
          { status: 400 }
        );
      }
      
      if (validatedData.data.diedDay && !validatedData.data.diedMonth) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Death month must be provided when day is specified"
            }
          },
          { status: 400 }
        );
      }
    }

    // Additional validation specifically for external links
    if ((validatedData.data.externalLinkTitle && !validatedData.data.externalLinkUrl) || 
        (!validatedData.data.externalLinkTitle && validatedData.data.externalLinkUrl)) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Both external link title and URL must be provided together"
          }
        },
        { status: 400 }
      );
    }

    // URL format validation for external link
    if (validatedData.data.externalLinkUrl) {
      try {
        // Basic URL validation beyond the schema validation
        new URL(validatedData.data.externalLinkUrl);
      } catch {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid external link URL format"
            }
          },
          { status: 400 }
        );
      }
    }

    // Create author profile with images and new date fields
    const authorProfile = await authorProfileService.create(validatedData.data);

    // Format the response to include formatted date strings alongside structured date fields
    let formattedResponse = authorProfile;
    if (authorProfile) {
      // Cast the entire authorProfile object to AuthorProfileWithDates since it has all the required fields
      const profileWithDates = authorProfile as unknown as AuthorProfileWithDates;
      
      // Get formatted dates using the service method
      const formattedDates = authorProfileService.formatDateFields?.(profileWithDates);
      
      // Include formatted dates in response if available
      if (formattedDates) {
        formattedResponse = {
          ...authorProfile,
          formattedBirthDate: formattedDates.birthDate,
          formattedDeathDate: formattedDates.deathDate,
          // Explicitly include external link fields to ensure they're in the response
          externalLinkTitle: authorProfile.externalLinkTitle,
          externalLinkUrl: authorProfile.externalLinkUrl
        } as AuthorProfile & {
          formattedBirthDate: string | null;
          formattedDeathDate: string | null;
        };
      }
    }

    return NextResponse.json({ data: formattedResponse });

  } catch (error: unknown) {
    console.error("[AUTHOR_PROFILES_POST]", error);

    if (error instanceof DuplicateAuthorProfileError) {
      return NextResponse.json(
        { 
          error: { 
            code: "DUPLICATE_AUTHOR_PROFILE", 
            message: error.message 
          } 
        },
        { status: 400 }
      );
    }

    if (error instanceof MaxImagesExceededError) {
      return NextResponse.json(
        {
          error: {
            code: "MAX_IMAGES_EXCEEDED",
            message: `Maximum ${getMaxFiles('authors')} images allowed`
          }
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}