import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * PKCE magic-link return URL. Session cookies must be written on this response;
 * keep cookie handling inline so Route Handler + redirect stay in one flow.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = url.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth", url.origin));
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // ignore
          }
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession:", error.message);
    return NextResponse.redirect(new URL("/login?error=auth", url.origin));
  }

  // Allow cookie writes from the auth client to flush before sending the redirect
  // (mitigates timing issues with deferred auth events in some server runtimes).
  await new Promise((resolve) => setTimeout(resolve, 0));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    const { syncTasksForUser } = await import("@/lib/sync/tasks-sync");
    await syncTasksForUser({
      userId: user.id,
      email: user.email,
    }).catch((err) => {
      console.error("[auth/callback] syncTasksForUser:", err);
    });
  }

  const redirectTo = new URL(nextPath, url.origin);
  return NextResponse.redirect(redirectTo);
}
