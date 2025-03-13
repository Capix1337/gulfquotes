// File: app/manage/author-profiles/[slug]/components/form/edit-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateAuthorProfileSchema, UpdateAuthorProfileInput } from "@/schemas/author-profile";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormHeader } from "./form-header";
import { FormSections } from "./form-sections";
import { Card, CardContent } from "@/components/ui/card";
import { ReloadIcon } from "@radix-ui/react-icons";
import { AuthorProfile } from "@prisma/client";

interface EditFormProps {
  author: AuthorProfile & {
    images: {
      id: string;
      url: string;
    }[];
  };
}

export function EditForm({ author }: EditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateAuthorProfileInput>({
    resolver: zodResolver(updateAuthorProfileSchema),
    defaultValues: {
      name: author.name,
      // Keep the legacy fields
      born: author.born || "",
      died: author.died || "",
      // Add the new structured date fields
      bornDay: author.bornDay,
      bornMonth: author.bornMonth,
      bornYear: author.bornYear,
      diedDay: author.diedDay,
      diedMonth: author.diedMonth,
      diedYear: author.diedYear,
      birthPlace: author.birthPlace || "",
      influences: author.influences || "",
      bio: author.bio,
      // Add external link fields
      externalLinkTitle: author.externalLinkTitle || "",
      externalLinkUrl: author.externalLinkUrl || "",
      images: author.images || [],
    },
  });

  async function onSubmit(data: UpdateAuthorProfileInput) {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/author-profiles/${author.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error.message);
      }

      toast.success("Author profile updated successfully");
      router.push("/manage/author-profiles");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <FormHeader title="Edit Author Profile" slug={author.slug} />
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormSections form={form} disabled={isSubmitting} />
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/manage/author-profiles")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}