// app/(general)/users/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Shell } from "@/components/users/shell"; 
import { UsersList } from "@/components/users/users-list";

// Rename the interface to avoid clashing with Next's built-in SearchParams types.
interface CustomSearchParams {
  page?: string;
  limit?: string;
  search?: string;
}

interface PageProps {
  // Now searchParams is a Promise that resolves to our custom type.
  searchParams: Promise<CustomSearchParams>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  // Await the searchParams promise before using it.
  const params = await searchParams;
  const initialLimit = Math.min(
    50,
    Math.max(1, Number(params.limit) || 10)
  );
  const initialPage = Math.max(1, Number(params.page) || 1);
  const initialSearch = params.search?.trim();

  return (
    <Shell>
      <div className="flex flex-col gap-8 p-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <UsersList 
            initialPage={initialPage}
            initialLimit={initialLimit}
            initialSearch={initialSearch}
          />
        </div>
      </div>
    </Shell>
  );
}