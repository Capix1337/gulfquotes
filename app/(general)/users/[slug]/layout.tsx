import { Suspense } from "react";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { ProfileNav } from "@/components/users/profile-nav";
import { notFound, redirect } from "next/navigation";

interface UserLayoutProps {
  children: React.ReactNode;
  params: { slug: string };
}

export default async function UserLayout({ children, params: paramsPromise }: UserLayoutProps) {
  // Resolve params promise
  const params = await paramsPromise;
  
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    // Fetch the basic user data just for navigation
    const headersList = await headers();
    const origin = process.env.NEXTAUTH_URL || "";
    const res = await fetch(`${origin}/api/users/${params.slug}`, {
      headers: {
        cookie: headersList.get("cookie") || "",
      },
      cache: "no-store", // Don't cache this request
    });

    if (!res.ok) {
      if (res.status === 404) {
        notFound();
      }
      throw new Error(`Failed to fetch user data: ${res.status}`);
    }

    const result = await res.json();
    
    if (!result.data) {
      notFound();
    }

    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="mx-auto w-full max-w-6xl">
          {/* Mobile Navigation - Only visible on small screens */}
          <div className="md:hidden">
            <Suspense fallback={<div className="h-10 animate-pulse bg-muted rounded-md" />}>
              <ProfileNav user={result.data} variant="mobile" />
            </Suspense>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 mt-4">
            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:block w-56 shrink-0">
              <Suspense fallback={<div className="h-48 animate-pulse bg-muted rounded-md" />}>
                <div className="sticky top-20">
                  <ProfileNav user={result.data} />
                </div>
              </Suspense>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in user layout:", error);
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <p className="text-destructive">Failed to load user profile navigation</p>
      </div>
    );
  }
}