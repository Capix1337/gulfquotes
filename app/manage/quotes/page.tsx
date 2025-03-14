// app/manage/quotes/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shells/shell";
import { QuoteTable } from "@/components/quotes/quote-table";
import { quoteService } from "@/lib/services/quote/quote.service";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

export const metadata = {
  title: "Quotes Management",
  description: "Manage your quotes collection"
};

export default async function QuotesPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const result = await quoteService.list({
      page: 1,
      limit: 50, // Increased limit since we're using a table view
      include: {
        authorProfile: true,
        category: true
      }
    });

    const transformedQuotes = result.items.map(quote => ({
      ...quote,
      author: {
        id: quote.authorProfile.id,
        name: quote.authorProfile.name,
        email: null,
        emailVerified: null,
        image: null,
        password: null,
        isTwoFactorEnabled: false,
        role: session.user.role
      }
    }));

    return (
      <Shell>
        <div className="flex flex-col gap-8 p-8">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight">Quotes</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your quotes collection
                </p>
              </div>
            </div>

            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"/>
              </div>
            }>
              <QuoteTable initialQuotes={transformedQuotes} />
            </Suspense>
          </div>
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("[QUOTES_PAGE]", error);
    return (
      <Shell>
        <div className="flex flex-col gap-8 p-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <h3 className="font-semibold">Something went wrong</h3>
              <p className="text-sm text-muted-foreground">
                Failed to load quotes. Please try again later.
              </p>
              <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
                Try again
              </Button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }
}
