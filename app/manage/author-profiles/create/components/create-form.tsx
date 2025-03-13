"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createAuthorProfileSchema, CreateAuthorProfileInput } from "@/schemas/author-profile";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormHeader } from "./form-header";
import { FormSections } from "./form-sections";
import { Card, CardContent } from "@/components/ui/card";
import { ReloadIcon } from "@radix-ui/react-icons";

export function CreateForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateAuthorProfileInput>({
    resolver: zodResolver(createAuthorProfileSchema),
    defaultValues: {
      name: "",
      slug: "",
      // Keep legacy fields
      born: "",
      died: "",
      // Add new structured date fields
      bornDay: null,
      bornMonth: null,
      bornYear: null,
      diedDay: null,
      diedMonth: null,
      diedYear: null,
      birthPlace: "",
      influences: "",
      bio: "",
      // Add external link fields
      externalLinkTitle: "",
      externalLinkUrl: "",
      images: [], 
    },
  });

  async function onSubmit(data: CreateAuthorProfileInput) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/author-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error.message);
      }

      toast.success("Author profile created successfully");
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
      <FormHeader title="Create Author Profile" />
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormSections form={form} disabled={isSubmitting} />
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                  Create Author Profile
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}