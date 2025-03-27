"use client";

import { Tag } from "@prisma/client";
import { TagIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TagWithCount extends Tag {
  _count?: {
    quotes: number;
  };
}

interface TagHeaderProps {
  tag: TagWithCount;
  className?: string;
}

export function TagHeader({ tag, className }: TagHeaderProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TagIcon className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">
              #{tag.name}
            </h1>
          </div>
          <Badge variant="outline" className="ml-2">
            {tag._count?.quotes || 0} quotes
          </Badge>
        </div>
        
        {tag.description && (
          <p className="text-muted-foreground">
            {tag.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}