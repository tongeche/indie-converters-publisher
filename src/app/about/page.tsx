import Image from "next/image";
import Link from "next/link";

const faqs = [
  {
    question: "What makes IndieConverters different from a traditional publisher?",
    answer:
      "We operate as an author-first studio. You keep 100% of your rights and royalties while accessing editorial, design, and distribution teams that normally sit inside larger houses.",
  },
  {
    question: "Can I choose only one service or do I need the full package?",
    answer:
      "You can scope à la carte services—cover design, editing, marketing—or launch a complete production bundle. Our team helps you build the right mix for your publishing goals.",
  },
  {
    question: "Where will my book be distributed?",
    answer:
      "We integrate with Amazon, Apple Books, Kobo, Google Play, IngramSpark, regional bookstores, and our own indie marketplace. Print-on-demand fulfillment handles paperback and hardcover.",
  },
  {
    question: "How long does a typical project take?",
    answer:
      "Most manuscripts move from onboarding to market in 8–12 weeks depending on the scope. Larger editorial engagements or illustrated books may take longer; timelines are shared upfront.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f6f4fb]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Image
          src="/assets/services-hero-image.png"
          alt="Indie author working"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-[#34146d]/90 to-[#8a20f9]/80" />
        <div className="relative mx-auto flex max-w-5xl flex-col gap-6 px-6 py-24 text-white sm:px-8 lg:py-32">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-white/70">
            About IndieConverters
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            We help authors own their publishing destiny.
          </h1>
          <p className="max-w-3xl text-lg text-white/80">
            Inspired by independent creators everywhere, we built a hybrid studio
            where craft-level editing, striking design, and global distribution
            live inside a single platform. Our team is spread across São Paulo,
            Lisbon, Nairobi, and Manila—united by a belief that powerful stories
            should not wait for permission.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-white/80">
            <span className="rounded-full border border-white/30 px-4 py-1">
              Editorial craftsmanship
            </span>
            <span className="rounded-full border border-white/30 px-4 py-1">
              Distribution intelligence
            </span>
            <span className="rounded-full border border-white/30 px-4 py-1">
              Community support
            </span>
          </div>
        </div>
      </section>

      {/* Story & stats */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-purple-200/30">
          <div className="grid gap-0 lg:grid-cols-2">
            <div className="border-b border-zinc-100 p-8 lg:border-b-0 lg:border-r lg:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#8a20f9]">
                Our story
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-zinc-900">
                Built for modern author-entrepreneurs.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-zinc-700">
                Traditional publishing moves slowly. Vanity presses overcharge
                and underdeliver. IndieConverters exists between those extremes:
                a creative operations studio backed by technology that respects
                creative ownership. We work side-by-side with authors, literary
                collectives, and small imprints to plan releases, build
                global-ready assets, and launch with data-informed marketing
                playbooks.
              </p>
              <p className="mt-4 text-base leading-relaxed text-zinc-700">
                Beyond the production pipeline, we mentor authors on pricing,
                rights management, and long-term business strategy. The result
                is a publishing partner that feels personal yet scales as your
                audience grows.
              </p>
            </div>
            <div className="relative min-h-[360px]">
              <Image
                src="/assets/partners/app-books.jpg"
                alt="Indie author collaboration"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#12092a]/90 via-[#12092a]/40 to-transparent" />
              <div className="relative flex h-full flex-col justify-end gap-4 p-8 text-white">
                <p className="text-sm uppercase tracking-[0.3em] text-white/70">
                  Field notes
                </p>
                <p className="text-lg font-semibold leading-snug">
                  “Our mission is simple: remove the obstacles between a finished
                  manuscript and a financially sustainable author career.”
                </p>
                <p className="text-sm text-white/80">
                  Dedicated pods coordinate editing, design, and distribution in daily sprints while authors keep full visibility into scope and royalties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="relative overflow-hidden py-20">
        <Image
          src="/assets/family.png"
          alt="Indie publishing community"
          fill
          className="object-cover"
          priority={false}
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6 text-center text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-white/70">
            Join the community
          </p>
          <h2 className="text-4xl font-semibold leading-tight">
            Publish your book with IndieConverters today
          </h2>
          <p className="text-base text-white/80">
            Full production, editorial mentorship, and worldwide distribution while you keep 100% of your rights.
          </p>
          <Link
            href="/publish"
            className="rounded-full bg-[#f4511e] px-10 py-3 text-sm font-semibold shadow-lg transition hover:scale-[1.03] hover:shadow-xl"
          >
            Publish now
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:px-8">
        <div className="rounded-3xl bg-white p-8 shadow-xl shadow-purple-100">
          <div className="space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#8a20f9]">
              FAQ
            </p>
            <h2 className="text-3xl font-semibold text-zinc-900">
              Answers for indie publishers
            </h2>
            <p className="text-sm text-zinc-600">
              Everything you need to know before launching a project with IndieConverters.
            </p>
          </div>
          <div className="mt-10 space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:shadow-lg"
                open={index === 0}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl px-6 py-4 text-left text-base font-semibold text-zinc-900 marker:content-none">
                  {faq.question}
                  <span className="text-sm font-bold text-[#8a20f9] group-open:rotate-45 transition">
                    +
                  </span>
                </summary>
                <div className="border-t border-zinc-100 px-6 py-4 text-sm text-zinc-600">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20 pt-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center rounded-3xl bg-gradient-to-br from-[#4b1e9d] to-[#8a20f9] px-8 py-16 text-center text-white shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-white/70">
            Ready to publish?
          </p>
          <h2 className="mt-4 text-3xl font-semibold">
            Join thousands of indie authors building on IndieConverters.
          </h2>
          <p className="mt-4 text-base text-white/80">
            Start with a discovery call or jump straight into the publishing
            workspace, where you can scope services, preview pricing, and plan
            your launch.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/publish"
              className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#4b1e9d] shadow-lg transition hover:shadow-xl"
            >
              Launch a project
            </Link>
            <Link
              href="/services"
              className="rounded-full border border-white/40 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Explore services
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
