"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useCallback, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"

export function AuthorSearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get("search") || "")

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set("search", term)
    } else {
      params.delete("search")
    }
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }, 300)

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value)
      handleSearch(e.target.value)
    },
    [handleSearch]
  )

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search authors..."
          onChange={onChange}
          value={value}
          className="pl-8"
        />
      </div>
    </div>
  )
}