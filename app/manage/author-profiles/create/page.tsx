// app/manage/author-profiles/create/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CreateForm } from "./components/create-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Author Profile - gulfquotes",
  description: "Create a new author profile",
};

export default async function CreateAuthorProfilePage() {
  // Check authentication and authorization
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="container">
      <CreateForm />
    </div>
  );
}