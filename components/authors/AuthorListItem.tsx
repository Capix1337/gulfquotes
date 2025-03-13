"use client"

import { useState } from "react"
import { Author } from "@/types/author"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
// import { cn } from "@/lib/utils"
import { getAuthorAvatarUrl } from "@/lib/utils/image-management"
import { AuthorFollowButton } from "@/app/(general)/authors/components/author-follow-button" 
import { Book } from "lucide-react"

interface AuthorListItemProps {
  author: Author
  variant?: "default" | "compact"
}

export function AuthorListItem({ author, variant = "default" }: AuthorListItemProps) {
  const [imageError, setImageError] = useState(false);
  // Transform the author image URL for optimal avatar display
  const avatarUrl = getAuthorAvatarUrl(author.image, 200);
  
  // Handle image loading error
  const handleImageError = () => {
    console.warn(`Failed to load avatar image for author: ${author.name}`);
    setImageError(true);
  };
  
  if (variant === "compact") {
    return (
      <Card className="overflow-hidden hover:bg-muted/50 transition-colors">
        <Link href={`/authors/${author.slug}`} className="block p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              {!imageError && (
                <AvatarImage 
                  src={avatarUrl} 
                  alt={author.name} 
                  className="object-cover"
                  onError={handleImageError}
                />
              )}
              <AvatarFallback>{author.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{author.name}</p>
              <p className="text-xs text-muted-foreground">{author.quoteCount} quotes</p>
            </div>
          </div>
        </Link>
      </Card>
    )
  }
  
  return (
    <Card className="overflow-hidden hover:bg-muted/50 transition-colors">
      <CardContent className="p-0">
        <div className="flex items-start gap-4 p-4 sm:p-6">
          <Link href={`/authors/${author.slug}`} className="shrink-0">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-background">
              {!imageError && (
                <AvatarImage 
                  src={avatarUrl} 
                  alt={author.name} 
                  className="object-cover"
                  onError={handleImageError}
                />
              )}
              <AvatarFallback className="text-xl">{author.name[0]}</AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex justify-between items-start gap-4">
              <Link href={`/authors/${author.slug}`} className="hover:underline">
                <h3 className="text-lg font-medium">{author.name}</h3>
              </Link>
              <AuthorFollowButton
                authorSlug={author.slug}
                initialFollowers={author.followers || 0}
                initialFollowed={author.isFollowed || false}
                size="sm"
                variant="outline"
              />
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground gap-4">
              <span className="flex items-center gap-1">
                <Book className="h-3.5 w-3.5" /> 
                {author.quoteCount} quotes
              </span>
              {author.bornYear && (
                <span>Born: {author.bornYear}</span>
              )}
            </div>
            
            {author.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                {author.bio}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Add Skeleton component for loading state
AuthorListItem.Skeleton = function AuthorListItemSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-start gap-4 p-4 sm:p-6">
          <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-8 w-20" />
            </div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}