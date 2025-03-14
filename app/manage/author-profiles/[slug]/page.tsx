// File: app/manage/author-profiles/[slug]/page.tsx

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { authorProfileService } from "@/lib/services/author-profile.service";
import { EditForm } from "./components/form/edit-form";
import { NotFound } from "./components/error/not-found";
// import { ErrorState } from "./components/error/error";
import Loading from "./components/loading/loading";
import { Shell } from "@/components/shells/shell";
import { Suspense } from "react";
import { ErrorBoundary } from "./components/error/error-boundary";

export const metadata = {
  title: "Edit Author Profile - gulfquotes",
  description: "Edit an existing author profile",
};

// Update the interface to match Next.js requirements
interface EditAuthorProfilePageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[]>>;
}

export default async function EditAuthorProfilePage({
  params: paramsPromise,
}: EditAuthorProfilePageProps) {
  // Check authentication and authorization
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  try {
    // Resolve params promise
    const params = await paramsPromise;
    
    // Fetch author profile data
    const author = await authorProfileService.getBySlug(params.slug);

    // Handle non-existent author profile
    if (!author) {
      return (
        <Shell>
          <div className="flex flex-col gap-8 p-8">
            <div className="mx-auto w-full max-w-6xl">
              <NotFound />
            </div>
          </div>
        </Shell>
      );
    }

    return (
      <Shell>
        <div className="flex flex-col gap-8 p-8">
          <div className="mx-auto w-full max-w-6xl">
            <Suspense fallback={<Loading />}>
              <EditForm author={author} />
            </Suspense>
          </div>
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("[EDIT_AUTHOR_PROFILE_PAGE]", error);
    
    return (
      <Shell>
        <div className="flex flex-col gap-8 p-8">
          <div className="mx-auto w-full max-w-6xl">
            <ErrorBoundary message="Something went wrong loading the author profile." />
          </div>
        </div>
      </Shell>
    );
  }
}