import { LoginForm } from "@/components/auth/login-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ error?: string; reason?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <LoginForm initialError={params.error} initialReason={params.reason} />
  );
}
