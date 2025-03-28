import { MetadataRoute } from "next";
import { MONTH_NAMES } from "@/lib/date-utils";
import prisma from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base URL
  const baseUrl = "https://gulfquotes.ae";
  
  // Get current date for lastModified
  const currentDate = new Date();
  
  // Create basic static routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/quotes`,
      lastModified: currentDate,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/authors`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tags`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/daily`,
      lastModified: currentDate,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/featured`,
      lastModified: currentDate,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/birthdays`,
      lastModified: currentDate,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    // {
    //   url: `${baseUrl}/auth/login`,
    //   lastModified: currentDate,
    //   changeFrequency: "monthly" as const,
    //   priority: 0.5,
    // },
    // {
    //   url: `${baseUrl}/register`,
    //   lastModified: currentDate,
    //   changeFrequency: "monthly" as const,
    //   priority: 0.5,
    // }
  ];

  // Get dynamic routes from database
  
  // Fetch all tags
  const tags = await prisma.tag.findMany({
    where: {
      // Only include tags that have quotes
      quotes: {
        some: {}
      }
    },
    select: {
      slug: true,
      updatedAt: true,
      _count: {
        select: {
          quotes: true
        }
      }
    },
    orderBy: {
      quotes: {
        _count: 'desc' // Order by popularity (most quotes first)
      }
    }
  });

  // Create tag routes - calculate priority based on number of quotes
  const tagRoutes = tags.map((tag) => {
    // Calculate a priority between 0.5 and 0.8 based on quote count
    // More quotes = higher priority
    const maxQuotes = Math.max(...tags.map(t => t._count.quotes));
    const normalizedCount = tag._count.quotes / maxQuotes;
    const priority = Math.max(0.5, Math.min(0.8, 0.5 + (normalizedCount * 0.3)));
    
    // Determine change frequency based on quote count
    // Tags with more quotes might be updated more frequently
    const changeFrequency = tag._count.quotes > 20 
      ? "weekly" 
      : "monthly";
      
    return {
      url: `${baseUrl}/tags/${tag.slug}`,
      lastModified: tag.updatedAt || currentDate,
      changeFrequency: changeFrequency as "weekly" | "monthly",
      priority: parseFloat(priority.toFixed(2)),
    };
  });

  // Fetch other dynamic routes from your existing implementation
  const [
    authorProfiles,
    quotes,
    categories,
    authorBirthdays,
    trendingQuotes
  ] = await Promise.all([
    // Author profiles
    prisma.authorProfile.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
    }),
    
    // Quotes
    prisma.quote.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      where: {
        // You might want to limit this query if you have a very large number of quotes
        // This is just an example limitation
        featured: true, 
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1000, // Limit to most recent 1000 quotes or adjust as needed
    }),
    
    // Categories
    prisma.category.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
    }),
    
    // Author birthdays
    prisma.authorProfile.groupBy({
      by: ['bornMonth', 'bornDay'],
      where: {
        bornMonth: { not: null },
        bornDay: { not: null }
      },
      _count: true,
    }),
    
    // Trending quotes for special highlighting
    prisma.trendingQuote.findMany({
      where: { 
        isActive: true 
      },
      select: {
        quote: {
          select: {
            slug: true,
            updatedAt: true,
          }
        },
      },
      orderBy: {
        rank: 'asc',
      },
    })
  ]);

  // Generate routes for author profiles
  const authorRoutes = authorProfiles.map((author) => ({
    url: `${baseUrl}/authors/${author.slug}`,
    lastModified: author.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  
  // Generate routes for quotes
  const quoteRoutes = quotes.map((quote) => ({
    url: `${baseUrl}/quotes/${quote.slug}`,
    lastModified: quote.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  
  // Add extra priority for trending quotes
  const trendingQuoteRoutes = trendingQuotes.map((trending, index) => {
    if (!trending.quote || !trending.quote.slug) return null;
    
    return {
      url: `${baseUrl}/quotes/${trending.quote.slug}`,
      lastModified: trending.quote.updatedAt,
      changeFrequency: "daily" as const, 
      priority: Math.max(0.7, 0.9 - (index * 0.02)), // Higher priority for top trending quotes
    };
  }).filter(Boolean);
  
  // Generate routes for categories
  const categoryRoutes = categories.map((category) => ({
    url: `${baseUrl}/categories/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
  
  // Create routes for birthday pages that have authors
  const birthdayRoutes = authorBirthdays.map(({ bornMonth, bornDay }) => {
    if (!bornMonth || !bornDay) return null;
    
    const month = MONTH_NAMES[bornMonth - 1];
    return {
      url: `${baseUrl}/birthdays/${month}_${bornDay}`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.6, 
    };
  }).filter(Boolean); // Remove nulls
  
  // Combine all routes - remove duplicates by URL
  const allRoutes = [
    ...staticRoutes,
    ...authorRoutes, 
    ...quoteRoutes,
    ...trendingQuoteRoutes,
    ...categoryRoutes,
    ...tagRoutes,
    ...birthdayRoutes,
  ].filter((route): route is NonNullable<typeof route> => route !== null);
  
  // Deduplicate URLs (in case trending quotes overlap with regular quotes)
  const urlMap = new Map();
  
  allRoutes.forEach(route => {
    // Now TypeScript knows route can't be null
    const existingRoute = urlMap.get(route.url);
    
    // If route doesn't exist or new route has higher priority, use it
    if (!existingRoute || (existingRoute.priority < route.priority)) {
      urlMap.set(route.url, route);
    }
  });
  
  // Convert map back to array
  return Array.from(urlMap.values());
}