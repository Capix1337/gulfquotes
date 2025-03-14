// File: app/manage/author-profiles/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { authorProfileService } from "@/lib/services/author-profile.service";
import { formatAuthorProfile } from "@/lib/utils/author-profile";
import { AuthorList } from "./components/author-list";
import { Shell } from "@/components/shells/shell";

export const metadata = {
  title: "Author Profiles",
  description: "Manage your author profiles"
};

export default async function AuthorProfilesPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login");
  }

  const result = await authorProfileService.list({
    page: 1,
    limit: 10
  });

  const authors = result.items.map(author => formatAuthorProfile(author));

  return (
    // Use Shell component for consistent page layout
    <Shell>
      <div className="flex flex-col gap-8 p-8">
        {/* Adds space between page edge and content */}
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <AuthorList authors={authors} />
        </div>
      </div>
    </Shell>
  );
}