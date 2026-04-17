"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="rounded-md border border-black/[0.1] bg-white px-3 py-1.5 text-sm text-ink transition-colors hover:bg-black/[0.03] disabled:opacity-50"
    >
      {loading ? "Bezig…" : "Uitloggen"}
    </button>
  );
}
