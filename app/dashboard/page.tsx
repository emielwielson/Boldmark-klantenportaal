import { SignOutButton } from "@/components/auth/sign-out-button";
import { resolveAndPersistPersonScope } from "@/lib/person-resolver";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?reason=session_expired");
  }

  if (user.email) {
    try {
      await resolveAndPersistPersonScope({
        userId: user.id,
        email: user.email,
      });
    } catch (err) {
      console.error("resolveAndPersistPersonScope failed:", err);
    }
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-ink/70">
              Ingelogd als{" "}
              <span className="font-medium text-ink">{user.email}</span>
            </p>
          </div>
          <SignOutButton />
        </header>

        <div className="rounded-lg border border-black/[0.06] bg-white px-6 py-8 shadow-sm">
          <p className="text-sm leading-relaxed text-ink/80">
            Taken uit Notion verschijnen hier na implementatie van
            synchronisatie (volgende taken). Je bent succesvol ingelogd met
            magic link.
          </p>
        </div>
      </div>
    </div>
  );
}
