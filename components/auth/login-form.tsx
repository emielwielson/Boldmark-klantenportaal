"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

type LoginFormProps = {
  initialError?: string;
  initialReason?: string;
};

export function LoginForm({ initialError, initialReason }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError === "auth"
      ? "Inloggen is mislukt. Probeer opnieuw of vraag een nieuwe link aan."
      : null,
  );
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error: signError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
        },
      });
      if (signError) {
        setError(signError.message);
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface px-6 py-8 shadow-sm">
        <h1 className="text-lg font-semibold tracking-tight text-content">
          Inloggen
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Voer je e-mailadres in. Je ontvangt een magic link om in te loggen.
        </p>

        {initialReason === "session_expired" && (
          <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Je sessie is verlopen. Log opnieuw in.
          </p>
        )}

        {sent ? (
          <p className="mt-6 text-sm text-content/85">
            Controleer je inbox voor de loginlink. Je kunt dit venster sluiten.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-content"
              >
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-field px-3 py-2 text-sm text-content outline-none ring-0 placeholder:text-content/40 focus:border-content/25"
                placeholder="naam@voorbeeld.nl"
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-content transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Verzenden…" : "Verstuur magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
