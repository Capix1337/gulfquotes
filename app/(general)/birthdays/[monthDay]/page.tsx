//app/(general)/birthdays/[monthDay]/page.tsx

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getMonthName, getMonthNumber } from "@/lib/date-utils";
import { BirthdayAuthorList } from "@/components/authors/BirthdayAuthorList";
import { DateSelector } from "@/components/authors/DateSelector";
import { BirthdayCalendar } from "@/components/authors/BirthdayCalendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { BirthdayStructuredDataWrapper } from "./components/BirthdayStructuredDataWrapper";


// Update the interface to match Next.js expectations
interface BirthdayPageProps {
  params: Promise<{ monthDay: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
}

// Update the function signature for generateMetadata
export async function generateMetadata({ 
  params 
}: {
  params: Promise<{ monthDay: string }>
}): Promise<Metadata> {
  try {
    // Await params before using
    const resolvedParams = await params;
    const [monthName, dayStr] = resolvedParams.monthDay.split('_');
    
    if (!monthName || !dayStr) return {
      title: "Authors by Birthday | gulfquotes",
      description: "Explore quotes from authors born on this day of the year."
    };
    
    const day = parseInt(dayStr, 10);
    const month = getMonthNumber(monthName);
    
    const formattedDate = `${getMonthName(month, true)} ${day}`;
    const canonicalPath = `/birthdays/${getMonthName(month).toLowerCase()}_${day}`;
    const currentYear = new Date().getFullYear();
    
    return {
      title: `Authors Born on ${formattedDate} | gulfquotes`,
      description: `Explore quotes from authors born on ${formattedDate}. Discover the wisdom of writers, philosophers, and notable figures who share this birthday.`,
      keywords: [
        `authors born on ${formattedDate}`, 
        `${formattedDate} birthdays`, 
        "famous authors birthdays", 
        "literary figures birthdays",
        "historical figures birth dates"
      ],
      alternates: {
        canonical: canonicalPath,
      },
      openGraph: {
        title: `Authors Born on ${formattedDate}`,
        description: `Explore quotes and wisdom from famous authors, philosophers, and personalities born on ${formattedDate}.`,
        type: 'website',
        url: `https://gulfquotes.ae${canonicalPath}`,
        images: [
          {
            url: `https://gulfquotes.ae/api/og?title=Authors+Born+on+${encodeURIComponent(formattedDate)}&date=${currentYear}`,
            width: 1200,
            height: 630,
            alt: `Authors born on ${formattedDate}`,
          }
        ],
        locale: 'en_US',
        siteName: 'gulfquotes',
      },
      twitter: {
        card: 'summary_large_image',
        title: `Authors Born on ${formattedDate} | gulfquotes`,
        description: `Discover quotes from authors born on ${formattedDate}.`,
        images: [`https://gulfquotes.ae/api/og?title=Authors+Born+on+${encodeURIComponent(formattedDate)}&date=${currentYear}`],
      },
    };
  } catch (error) {
    console.error(error);
    return {
      title: "Authors by Birthday | gulfquotes",
      description: "Explore quotes from authors born on this day of the year."
    };
  }
}

export default async function BirthdayPage({ params, searchParams }: BirthdayPageProps) {
  // Await params before using
  const resolvedParams = await params;
  // Await searchParams before using
  const resolvedSearchParams = await searchParams;
  
  const [monthName, dayStr] = resolvedParams.monthDay.split('_');
  
  if (!monthName || !dayStr) {
    notFound();
  }
  
  const day = parseInt(dayStr, 10);
  if (isNaN(day) || day < 1 || day > 31) {
    notFound();
  }
  
  let month: number;
  try {
    month = getMonthNumber(monthName);
  } catch (error) {
    console.error(error);
    notFound();
  }
  
  // Parse pagination parameters
  const page = parseInt(resolvedSearchParams.page || "1", 10);
  const limit = Math.min(50, parseInt(resolvedSearchParams.limit || "12", 10));
  
  // Format the date for display
  const formattedDate = `${getMonthName(month, true)} ${day}`;
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">Authors Born on {formattedDate}</h1>
      <p className="text-muted-foreground mb-8">
        Discover quotes and wisdom from authors who share this birthday.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar with tools */}
        <div className="lg:col-span-1 space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Find Another Date</h2>
            <DateSelector 
              variant="compact" 
              initialDay={day} 
              initialMonth={month}
            />
          </div>
          
          <div className="hidden lg:block">
            <h2 className="text-xl font-semibold mb-3">Browse Calendar</h2>
            <BirthdayCalendar 
              initialMonth={month} 
              className="mb-4"
            />
          </div>
        </div>
        
        {/* Main content area with author list */}
        <div className="lg:col-span-3">
          {/* Structured data is rendered at the server level */}
          <BirthdayStructuredDataWrapper day={day} month={month} />
          
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(limit).fill(0).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="p-4 space-y-4">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-3 w-[100px]" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-5/6" />
                      <Skeleton className="h-3 w-4/6" />
                    </div>
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          }>
            <BirthdayAuthorList 
              day={day}
              month={month}
              page={page}
              limit={limit}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
