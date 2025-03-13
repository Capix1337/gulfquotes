import { Suspense } from "react"
import { AuthorHeader } from "@/components/authors/AuthorHeader"
import { AuthorSearchBar } from "@/components/authors/AuthorSearchBar"
import { AlphabetNav } from "@/components/authors/AlphabetNav"
import { AuthorGrid } from "@/components/authors/AuthorGrid"
import { AuthorPagination } from "@/components/authors/Pagination"
import { DateSelector } from "@/components/authors/DateSelector" // Add import for DateSelector
import { ErrorBoundary } from "@/components/shared/error-boundary"
import { AuthorSkeleton } from "./loading"
import { fetchAuthors } from "@/lib/authors"
import type { AuthorsResponse } from "@/types/author"
import { auth } from "@/auth"

interface SearchParams {
  page?: string
  limit?: string
  search?: string
  letter?: string
}

interface PageProps {
  searchParams?: Promise<SearchParams>
}

export const metadata = {
  title: "Authors | gulfquotes",
  description: "Browse through our collection of authors and their timeless quotes.",
}

export default async function AuthorsPage({ 
  searchParams = Promise.resolve({}) 
}: PageProps) {
  const params = await searchParams
  const session = await auth()
  
  const page = Math.max(1, Number(params.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(params.limit) || 10))
  const search = params.search?.trim()
  const letter = params.letter?.toUpperCase()

  try {
    const result: AuthorsResponse = await fetchAuthors({
      page,
      limit,
      search,
      letter,
      userId: session?.user?.id, // Pass the user ID if logged in
    })

    if (result.error) {
      throw new Error(result.error.message)
    }

    if (!result.data) {
      throw new Error("No data returned from API")
    }

    return (
      <div className="container max-w-4xl mx-auto space-y-8 py-8">
        <AuthorHeader />
        <ErrorBoundary>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <AuthorSearchBar />
              </div>
            </div>
            
            <AlphabetNav />
            
            <Suspense fallback={<AuthorSkeleton />}>
              <AuthorGrid 
                authors={result.data.items} 
                isLoading={false} 
              />
            </Suspense>
            
            <AuthorPagination
              currentPage={page}
              totalPages={Math.ceil(result.data.total / limit)}
            />
          </div>
        </ErrorBoundary>
      </div>
    )
  } catch (error) {
    console.error("[AUTHORS_PAGE]", error)
    return (
      <div className="container space-y-8 py-8">
        <AuthorHeader />
        <div className="flex flex-col gap-6">
          <AuthorSearchBar />
          {/* Add DateSelector even on error state */}
          <DateSelector className="mb-4" />
          <AlphabetNav />
          <div className="text-center py-12 text-muted-foreground">
            Failed to load authors. Please try again later.
          </div>
        </div>
      </div>
    )
  }
}