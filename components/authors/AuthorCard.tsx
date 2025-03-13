import { Author } from "@/types/author"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getAuthorAvatarUrl } from "@/lib/utils/image-management"

interface AuthorCardProps {
  author: Author
}

export function AuthorCard({ author }: AuthorCardProps) {
  // Transform the author image URL for optimal avatar display
  const avatarUrl = getAuthorAvatarUrl(author.image, 200);
  
  return (
    <Link href={`/authors/${author.slug}`}>
      <Card className={cn(
        "transition-all duration-200",
        "hover:bg-muted/50 hover:shadow-md"
      )}>
        <CardHeader className="flex flex-row items-center gap-4 p-4">
          <Avatar className="h-12 w-12">
            <AvatarImage 
              src={avatarUrl} 
              alt={author.name} 
              className="object-cover" // Ensure image maintains aspect ratio
            />
            <AvatarFallback>{author.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h3 className="font-medium line-clamp-1">{author.name}</h3>
            <p className="text-sm text-muted-foreground">
              {author.quoteCount} quotes
            </p>
          </div>
        </CardHeader>
        {author.bio && (
          <CardContent className="pt-0 pb-4 px-4">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {author.bio}
            </p>
          </CardContent>
        )}
      </Card>
    </Link>
  )
}

// Add Skeleton component for loading state
AuthorCard.Skeleton = function AuthorCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4 px-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mt-2" />
      </CardContent>
    </Card>
  )
}