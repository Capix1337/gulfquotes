"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface TagSortProps {
  sort: string;
  total: number;
  count: number;
}

export function TagSort({ sort, total, count }: TagSortProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Handle sort change
  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    
    // Reset to first page when changing sort
    params.set("page", "1");
    
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Get display text for the current sort option
  const getSortLabel = (sortType: string) => {
    switch (sortType) {
      case "recent":
        return "Most Recent";
      case "popular":
        return "Most Popular";
      case "alphabetical":
        return "Alphabetical";
      default:
        return "Most Recent";
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{count}</span> of{" "}
        <span className="font-medium">{total}</span> quotes
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <Select
          value={sort || "recent"}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={getSortLabel(sort)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}