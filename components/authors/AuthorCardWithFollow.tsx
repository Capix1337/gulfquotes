"use client";

import { Author } from "@/types/author";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { AuthorFollowButton } from "@/app/(general)/authors/components/author-follow-button";
import { useState } from "react";
import { getAuthorAvatarUrl } from "@/lib/utils/image-management";

interface AuthorCardWithFollowProps {
  author: Author;
}

export function AuthorCardWithFollow({ author }: AuthorCardWithFollowProps) {
  // State to track follow changes locally
  const [currentFollowers, setCurrentFollowers] = useState(author.followers);
  const [isFollowed, setIsFollowed] = useState(author.isFollowed);
  
  // Transform the author image URL for optimal avatar display
  const avatarUrl = getAuthorAvatarUrl(author.image, 200);

  // Format the follower count for display
  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };
  
  // Handle follow status changes from the button
  const handleFollowChange = (followed: boolean, followers: number) => {
    setIsFollowed(followed);
    setCurrentFollowers(followers);
  };

  return (
    <Card className={cn(
      "transition-all duration-200",
      "hover:bg-muted/50 hover:shadow-md",
      // Add conditional styling based on follow status
      isFollowed && "border-primary/30 bg-primary/5"
    )}>
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        {/* Author avatar and name section */}
        <Link href={`/authors/${author.slug}`}>
          <Avatar className={cn(
            "h-12 w-12",
            isFollowed && "ring-2 ring-primary/20"
          )}>
            <AvatarImage 
              src={avatarUrl} 
              alt={author.name} 
              className="object-cover" 
            />
            <AvatarFallback>{author.name[0]}</AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex flex-col flex-1">
          <Link href={`/authors/${author.slug}`} className="hover:underline">
            <h3 className="font-medium line-clamp-1">{author.name}</h3>
          </Link>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {author.quoteCount} quotes
            </p>
            {currentFollowers > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{formatFollowerCount(currentFollowers)}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Follow button with onFollowChange callback */}
        <AuthorFollowButton
          authorSlug={author.slug}
          initialFollowers={author.followers}
          initialFollowed={author.isFollowed}
          size="sm"
          variant="outline"
          onFollowChange={handleFollowChange}
        />
      </CardHeader>
      
      {/* Author bio */}
      {author.bio && (
        <CardContent className="pt-0 pb-4 px-4">
          <Link href={`/authors/${author.slug}`}>
            <p className="text-sm text-muted-foreground line-clamp-2 hover:text-foreground/80 transition-colors">
              {author.bio}
            </p>
          </Link>
        </CardContent>
      )}
    </Card>
  );
}