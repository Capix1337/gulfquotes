//app/manage/quotes/create/page.tsx

import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { QuoteForm } from "@/components/quotes/quote-form";
import { CategoryForm } from "@/components/quotes/category-form";
import db from "@/lib/prisma";
import type { QuoteFormData } from "@/schemas/quote";

export default async function NewQuotePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "AUTHOR") {
    redirect("/unauthorized");
  }

  // Fetch data in parallel
  const [categories, authorProfiles, galleryItems] = await Promise.all([
    db.category.findMany(),
    db.authorProfile.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        born: true,
        died: true,
        // Add the new structured date fields
        bornDay: true,
        bornMonth: true,
        bornYear: true,
        diedDay: true,
        diedMonth: true,
        diedYear: true,
        birthPlace: true,
        influences: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        followers: true,
        // Add these missing external link fields
        externalLinkTitle: true,
        externalLinkUrl: true,
      },
      orderBy: {
        name: 'asc'
      }
    }),
    db.gallery.findMany({
      where: { isGlobal: true },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  // Set initial data with correct type
  const initialData: QuoteFormData = {
    content: "",
    categoryId: categories[0]?.id || "",
    authorProfileId: authorProfiles[0]?.id || "",
    slug: "",
    backgroundImage: undefined,
    galleryImages: galleryItems,
    tags: [] // No need for type assertion now
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Create a New Quote</h1>
      <QuoteForm 
        categories={categories} 
        authorProfiles={authorProfiles}
        initialData={initialData}
      />
      
      {session.user.role === "ADMIN" && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Create a New Category</h2>
          <CategoryForm />
        </div>
      )}
    </div>
  );
}