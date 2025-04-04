// app/(general)/quotes/[slug]/components/comments/reply-form.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createReplySchema, type CreateReplyInput } from "@/schemas/comment.schema";
// Import the login prompt component
import { LoginPrompt } from "../login-prompt";

interface ReplyFormProps {
  commentId: string;
  quoteSlug: string;
  onReplyAdded?: () => void;
  onCancel?: () => void;
}

export function ReplyForm({ 
  commentId, 
  quoteSlug,
  onReplyAdded,
  onCancel
}: ReplyFormProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form
  const form = useForm<CreateReplyInput>({
    resolver: zodResolver(createReplySchema),
    defaultValues: {
      content: "",
    },
  });

  // Submit handler
  async function onSubmit(data: CreateReplyInput) {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/quotes/${quoteSlug}/comments/${commentId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to submit reply");
      }

      form.reset();
      router.refresh();
      onReplyAdded?.();
      toast.success("Reply posted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show login prompt if not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="ml-10">
        <LoginPrompt 
          variant="compact" 
          description="Sign in to reply to this comment"
          callToAction="Sign in to reply"
          redirectUrl={`/quotes/${quoteSlug}`}
        />
      </div>
    );
  }

  return (
    <div className="flex gap-3 mt-3 ml-2">
      <Avatar className="h-7 w-7">
        <AvatarImage 
          src={session?.user?.image || undefined} 
          alt={session?.user?.name || "User"} 
        />
        <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
      </Avatar>

      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 flex flex-col gap-2"
        >
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="flex-1 space-y-0">
                <FormControl>
                  <Textarea 
                    placeholder="Add your reply..."
                    className="resize-none min-h-20"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              size="sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Reply"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}