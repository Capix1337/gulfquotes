"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TagPaginationProps {
  totalPages: number;
  currentPage: number;
  className?: string;
}

export function TagPagination({ 
  totalPages, 
  currentPage,
  className
}: TagPaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Helper to create page URLs
  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };
  
  // Get the page numbers to display
  const getPageNumbers = () => {
    const pageNumbers: (number | 'ellipsis')[] = [];
    
    if (totalPages <= 7) {
      // Show all pages if total pages are 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      // Show ellipsis if needed
      if (currentPage > 3) {
        pageNumbers.push('ellipsis');
      }
      
      // Calculate middle pages
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Show ellipsis if needed
      if (currentPage < totalPages - 2) {
        pageNumbers.push('ellipsis');
      }
      
      // Always show last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Select
          defaultValue="12"
          onValueChange={(value) => {
            const params = new URLSearchParams(searchParams);
            params.set("limit", value);
            params.set("page", "1"); // Reset to first page
            window.location.href = `${pathname}?${params.toString()}`;
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Quotes per page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12">12 per page</SelectItem>
            <SelectItem value="24">24 per page</SelectItem>
            <SelectItem value="48">48 per page</SelectItem>
          </SelectContent>
        </Select>
        
        <Pagination>
          <PaginationContent>
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious href={createPageURL(currentPage - 1)} />
              </PaginationItem>
            )}
            
            {getPageNumbers().map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <div className="flex h-9 w-9 items-center justify-center">
                      &hellip;
                    </div>
                  </PaginationItem>
                );
              }
              
              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    href={createPageURL(page)}
                    isActive={page === currentPage}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationNext href={createPageURL(currentPage + 1)} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      </div>
      
      <div className="text-center text-xs text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
}