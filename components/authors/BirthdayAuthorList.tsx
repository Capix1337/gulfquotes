"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
// import Image from "next/image";
// import { formatBirthdate } from "@/lib/date-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
// Import the utility function for avatar image optimization
import { getAuthorAvatarUrl } from "@/lib/utils/image-management";

interface Author {
  id: string;
  name: string;
  slug: string;
  bio: string;
  bornYear: number | null;
  bornMonth: number | null;
  bornDay: number | null;
  diedYear: number | null;
  diedMonth: number | null;
  diedDay: number | null;
  birthPlace: string | null;
  images: { id: string; url: string }[];
  _count?: { quotes: number };
}

interface BirthdayAuthorListProps {
  day: number;
  month: number;
  page?: number;
  limit?: number;
  onDataLoaded?: (authors: Author[], totalAuthors: number) => React.ReactNode;
}

interface ApiResponse {
  data?: {
    authors: {
      items: Author[];
      total: number;
      page: number;
      limit: number;
      hasMore: boolean;
    };
    day: number;
    month: number;
    monthName: string;
    formattedDate: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export function BirthdayAuthorList({ 
  day, 
  month, 
  page = 1, 
  limit = 12,
  onDataLoaded
}: BirthdayAuthorListProps) {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(page);
  const [formattedDate, setFormattedDate] = useState("");
  
  // Add state to track image errors
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  // Handle image error
  const handleImageError = (authorId: string) => {
    setImageErrors(prev => ({
      ...prev,
      [authorId]: true
    }));
  };
  
  // Effect to fetch authors by birthday
  useEffect(() => {
    async function fetchAuthorsByBirthday() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/birthdays/${month}_${day}?page=${currentPage}&limit=${limit}`);
        const data: ApiResponse = await response.json();
        
        if (data.error) {
          setError(data.error.message);
          setAuthors([]);
        } else if (data.data) {
          setAuthors(data.data.authors.items);
          setTotalPages(Math.ceil(data.data.authors.total / limit));
          setFormattedDate(data.data.formattedDate);
          
          // Call onDataLoaded if provided
          if (onDataLoaded) {
            onDataLoaded(data.data.authors.items, data.data.authors.total);
          }
        }
      } catch (err) {
        console.error("Error fetching authors:", err);  
        setError("Failed to fetch authors. Please try again.");
        setAuthors([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAuthorsByBirthday();
  }, [day, month, currentPage, limit, onDataLoaded]);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(limit).fill(0).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium text-red-600 mb-2">Error</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button 
          onClick={() => setCurrentPage(1)} 
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  if (authors.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium mb-2">No Authors Found</h3>
        <p className="text-muted-foreground mb-4">
          There are no authors in our database born on {formattedDate}.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {authors.map((author) => {
          // Transform the author image URL for optimal avatar display
          const avatarUrl = author.images?.[0] 
            ? getAuthorAvatarUrl(author.images[0].url, 100)
            : '';
            
          return (
            <Card key={author.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12">
                    {!imageErrors[author.id] && avatarUrl && (
                      <AvatarImage 
                        src={avatarUrl} 
                        alt={author.name} 
                        className="object-cover"
                        onError={() => handleImageError(author.id)}
                      />
                    )}
                    <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Link href={`/authors/${author.slug}`} className="font-medium hover:underline">
                      {author.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {author.bornYear && `Born ${author.bornYear}`}
                      {author.diedYear && ` - Died ${author.diedYear}`}
                    </p>
                  </div>
                </div>
                
                {author.birthPlace && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Born in {author.birthPlace}
                  </p>
                )}
                
                <p className="text-sm line-clamp-2 text-muted-foreground mb-3">
                  {author.bio}
                </p>
                
                <div className="text-sm flex justify-between items-center mt-2">
                  <span className="text-muted-foreground">
                    {author._count?.quotes || 0} quotes
                  </span>
                  <Link 
                    href={`/authors/${author.slug}`}
                    className="text-primary hover:underline text-sm"
                  >
                    View Profile
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            {/* Previous page button */}
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage - 1);
                  }} 
                />
              </PaginationItem>
            )}
            
            {/* First page */}
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(1);
                }}
                isActive={currentPage === 1}
              >
                1
              </PaginationLink>
            </PaginationItem>
            
            {/* Page numbers logic */}
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNumber = i + 1;
              // Show current page and adjacent pages
              if (
                (pageNumber > 1 && pageNumber < currentPage - 1 && pageNumber > 2) ||
                (pageNumber < totalPages && pageNumber > currentPage + 1 && pageNumber < totalPages - 1)
              ) {
                return null; // Skip non-adjacent pages
              }
              
              // Show ellipsis for skipped pages
              if (pageNumber === 2 && currentPage > 4) {
                return (
                  <PaginationItem key={`ellipsis-start`}>
                    <span className="px-4">...</span>
                  </PaginationItem>
                );
              }
              
              if (pageNumber === totalPages - 1 && currentPage < totalPages - 3) {
                return (
                  <PaginationItem key={`ellipsis-end`}>
                    <span className="px-4">...</span>
                  </PaginationItem>
                );
              }
              
              // Skip first and last pages (handled separately)
              if (pageNumber === 1 || pageNumber === totalPages) {
                return null;
              }
              
              // Render page number
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(pageNumber);
                    }}
                    isActive={pageNumber === currentPage}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            {/* Last page */}
            {totalPages > 1 && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(totalPages);
                  }}
                  isActive={currentPage === totalPages}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            )}
            
            {/* Next page button */}
            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage + 1);
                  }} 
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}