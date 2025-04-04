import { NextResponse } from "next/server"
import type { AuthorsResponse } from "@/types/author"
import { fetchAuthors } from "@/lib/authors"
import { getPaginationParams } from "@/lib/pagination"

export async function GET(req: Request): Promise<NextResponse<AuthorsResponse>> {
  try {
    const searchParams = new URL(req.url).searchParams
    const { page, limit } = getPaginationParams(searchParams)
    const search = searchParams.get("search")?.trim()
    const letter = searchParams.get("letter")?.toUpperCase()

    const result = await fetchAuthors({
      page,
      limit,
      search,
      letter
    })

    // The result already has the correct structure, just return it
    return NextResponse.json(result)
  } catch (error) {
    console.error("[AUTHORS_GET]", error)
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}