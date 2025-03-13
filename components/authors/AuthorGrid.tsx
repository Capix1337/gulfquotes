"use client"

import { Author } from "@/types/author"
import { AuthorListItem } from "./AuthorListItem" // New component we'll create
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  LayoutGrid, 
  LayoutList, 
} from "lucide-react"

interface AuthorGridProps {
  authors: Author[]
  isLoading?: boolean
}

export function AuthorGrid({ authors, isLoading }: AuthorGridProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <AuthorListItem.Skeleton key={i} />
        ))}
      </div>
    )
  }

  if (authors.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No authors found.</p>
      </div>
    )
  }

  // // Optional: Split into featured and regular authors
  // const featuredAuthors = authors.filter(author => author.quoteCount > 10).slice(0, 4);
  // const regularAuthors = authors.filter(author => !featuredAuthors.includes(author));

  return (
    <div className="space-y-8">
      <Tabs defaultValue="list" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Authors ({authors.length})</h2>
          <TabsList>
            <TabsTrigger value="list"><LayoutList className="h-4 w-4 mr-2" /> List</TabsTrigger>
            <TabsTrigger value="compact"><LayoutGrid className="h-4 w-4 mr-2" /> Compact</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="list" className="space-y-4">
          {authors.map((author) => (
            <AuthorListItem key={author.id} author={author} />
          ))}
        </TabsContent>
        
        <TabsContent value="compact" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {authors.map((author) => (
            <AuthorListItem key={author.id} author={author} variant="compact" />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}