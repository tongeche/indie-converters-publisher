"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [penName, setPenName] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUserId(data.user.id);
    });
  }, [supabase, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return;

    setLoading(true);
    setError(null);

    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        display_name: displayName,
        pen_name: penName || null,
        website_url: website || null,
        bio: bio || null,
      },
      { onConflict: "id" }
    );

    setLoading(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    router.push("/publish");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f4fb] px-4 py-16">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#7827c7]">
          Step 1
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
          Complete your profile
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Tell us about yourself so we can personalize your publishing workspace.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-1">
            <label
              htmlFor="display-name"
              className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500"
            >
              Display name
            </label>
            <input
              id="display-name"
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 focus:border-[#f4511e] focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="pen-name"
              className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500"
            >
              Pen name (optional)
            </label>
            <input
              id="pen-name"
              value={penName}
              onChange={(event) => setPenName(event.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 focus:border-[#f4511e] focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="website"
              className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500"
            >
              Website
            </label>
            <input
              id="website"
              type="url"
              placeholder="https://example.com"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 focus:border-[#f4511e] focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="bio"
              className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500"
            >
              Short bio
            </label>
            <textarea
              id="bio"
              rows={4}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 focus:border-[#f4511e] focus:outline-none"
            />
          </div>
          {error && (
            <p className="text-sm font-semibold text-[#f4511e]">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !userId}
            className="w-full rounded-full bg-gradient-to-r from-pink-500 to-orange-400 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01] hover:shadow-xl disabled:opacity-60"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
