"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/onboarding");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f4fb] px-4 py-16">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#7827c7]">
          Welcome back
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Use your IndieConverters credentials to access the admin workspace.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 focus:border-[#f4511e] focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 focus:border-[#f4511e] focus:outline-none"
            />
          </div>
          {error && (
            <p className="text-sm font-semibold text-[#f4511e]">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-pink-500 to-orange-400 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01] hover:shadow-xl disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-[#7827c7] hover:text-[#5c1da5]"
          >
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
