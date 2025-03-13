// components/authors/AuthorPageHeader.tsx
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Author } from "@/types/author";
import { AuthorFollowButton } from "@/app/(general)/authors/components/author-follow-button";
import { Book, Users, Calendar } from "lucide-react";
import Link from "next/link";
import { getMonthName } from "@/lib/date-utils";
import { getAuthorAvatarUrl } from "@/lib/utils/image-management";

interface AuthorPageHeaderProps {
  author: Author & {
    totalQuotes: number;
    // Add the structured birth date fields
    bornDay?: number | null;
    bornMonth?: number | null;
    bornYear?: number | null;
    diedDay?: number | null;
    diedMonth?: number | null;
    diedYear?: number | null;
    birthPlace?: string | null;
  };
  className?: string;
}

export function AuthorPageHeader({ author, className }: AuthorPageHeaderProps) {
  const [imageError, setImageError] = useState(false);
  // Use Cloudinary transformation for author image - larger size for profile page
  const avatarUrl = getAuthorAvatarUrl(author.image, 300);
  
  // Handle image loading error
  const handleImageError = () => {
    console.warn(`Failed to load avatar image for author: ${author.name}`);
    setImageError(true);
  };

  // Format the birth date parts
  const hasBirthDate = author.bornMonth && author.bornDay;
  const birthMonth = author.bornMonth ? getMonthName(author.bornMonth, true) : null;
  const birthDay = author.bornDay || null;
  const birthYear = author.bornYear || null;
  
  // Create the birthday link path
  const birthdayPath = hasBirthDate 
    ? `/birthdays/${getMonthName(author.bornMonth!).toLowerCase()}_${author.bornDay}`
    : null;
  
  // Format the death date if available
  const hasDied = author.diedYear || author.died;
  const deathInfo = author.diedYear 
    ? `Died: ${getMonthName(author.diedMonth || 1, true)} ${author.diedDay || ''}, ${author.diedYear}` 
    : (author.died ? `Died: ${author.died}` : null);
  
  // Format the birth place if available
  const birthPlaceInfo = author.birthPlace ? `in ${author.birthPlace}` : '';
  
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          {/* Author Avatar - updated with error handling */}
          <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background">
            {!imageError && (
              <AvatarImage 
                src={avatarUrl} 
                alt={author.name} 
                className="object-cover" 
                onError={handleImageError}
              />
            )}
            <AvatarFallback className="text-2xl">{author.name[0]}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-4">
            {/* Author Name and Follow Button */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold">{author.name}</h1>
                
                {/* New formatted birth/death information with link */}
                <div className="text-muted-foreground space-y-1">
                  {hasBirthDate && (
                    <p className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Born: {' '} 
                        {birthdayPath ? (
                          <Link href={birthdayPath} className="text-primary hover:underline">
                            {birthMonth} {birthDay}
                          </Link>
                        ) : (
                          <>{birthMonth} {birthDay}</>
                        )}
                        {birthYear ? `, ${birthYear}` : ''}
                        {' '}
                        {birthPlaceInfo}
                      </span>
                    </p>
                  )}
                  
                  {hasDied && (
                    <p>{deathInfo}</p>
                  )}
                </div>
              </div>
              
              <AuthorFollowButton
                authorSlug={author.slug}
                initialFollowers={author.followers}
                initialFollowed={author.isFollowed}
                showCount={true}
              />
            </div>
            
            {/* Author Stats */}
            <div className="flex flex-wrap justify-center md:justify-start gap-6">
              <div className="flex items-center gap-2">
                <Book className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{author.quoteCount} quotes</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{author.followers} followers</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}