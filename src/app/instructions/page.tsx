import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Build Checklist · IndieConverters",
};

const tasks = [
  "Catalog, book detail, author, imprint, news, and events routes",
  "Supabase-powered filters + search (genres, formats, keywords)",
  "Submissions form + newsletter API backed by Supabase",
  "SEO JSON-LD, sitemap, and accessibility polish",
];

export default function InstructionsPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-16">
      <section className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Build checklist
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-zinc-900">
          IndieConverters delivery board
        </h1>
        <p className="mt-3 text-base text-zinc-600">
          This summary mirrors the requirements documented in{" "}
          <code className="rounded bg-zinc-100 px-2 py-1 text-sm text-zinc-800">
            Instructions.md
          </code>{" "}
          at the repo root. Refer to that file for the full roadmap, sample SQL,
          and Supabase guidance.
        </p>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-zinc-900">Core goals</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-600">
          {tasks.map((task) => (
            <li key={task}>{task}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-zinc-900">
          Immediate actions
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-zinc-600">
          <li>
            Keep the Supabase CLI logged in and run{" "}
            <code className="rounded bg-zinc-100 px-2 py-1">supabase db push</code>{" "}
            whenever migrations change.
          </li>
          <li>
            Mirror Supabase credentials into{" "}
            <code className="rounded bg-zinc-100 px-2 py-1">.env.local</code> for
            Next.js and keep{" "}
            <code className="rounded bg-zinc-100 px-2 py-1">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            server-only.
          </li>
          <li>
            Implement feature slices (catalog, authors, news, events, submissions)
            as server components for SEO-friendly rendering.
          </li>
        </ol>
      </section>
    </main>
  );
}

