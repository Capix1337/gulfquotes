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
    {
      url: `${baseUrl}/auth/login`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }
  ];
  
  // Fetch all dynamic content concurrently to optimize performance
  const [
    authorProfiles,
    quotes,
    categories,
    tags,
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
    
    // Tags
    prisma.tag.findMany({
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
  
  // Generate routes for tags
  const tagRoutes = tags.map((tag) => ({
    url: `${baseUrl}/tags/${tag.slug}`,
    lastModified: tag.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.5,
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