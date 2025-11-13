'use client';

import { useMemo, useState } from "react";
import Link from "next/link";

const bookFormats = [
  { label: "Hardcover", description: "15 x 23 cm", value: "hardcover" },
  { label: "Trade Paperback", description: "14 x 21 cm", value: "trade" },
  { label: "Pocket", description: "10.5 x 18 cm", value: "pocket" },
];

const channels = [
  "Amazon",
  "Apple Books",
  "Kobo",
  "OverDrive",
  "Scribd",
  "Barnes & Noble",
];

const publicationTypeOptions = [
  { label: "Ebook", value: "ebook" },
  { label: "Print", value: "print" },
  { label: "Audiobook", value: "audio" },
];

export default function PublishPage() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState("trade");
  const [pages, setPages] = useState("");
  const [paper, setPaper] = useState("Matte 80g");
  const [finish, setFinish] = useState("Soft touch");
  const [printPrice, setPrintPrice] = useState("9.99");
  const [ebookPrice, setEbookPrice] = useState("4.99");

  const toggleType = (value: string) => {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const selectedFormatLabel = useMemo(
    () => bookFormats.find((format) => format.value === selectedFormat),
    [selectedFormat]
  );

  const showPreview =
    selectedTypes.length > 0 || pages || printPrice || ebookPrice;

  return (
    <main className="min-h-screen bg-[#f6f4fb] py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 lg:flex-row">
        <section className="flex-1 rounded-3xl bg-white p-8 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#7827c7]">
            Simulate your launch
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
            Plan your publication
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            Choose formats, pricing, and quantities to see how your IndieConverters
            release will look across global channels.
          </p>

          <div className="mt-8 space-y-8 text-sm text-zinc-700">
            <div>
              <p className="font-semibold text-zinc-900">Publication type</p>
              <div className="mt-3 flex flex-wrap gap-4">
                {publicationTypeOptions.map(({ label, value }) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-2 font-medium transition ${
                      selectedTypes.includes(value)
                        ? "border-[#f4511e] bg-[#f4511e]/10 text-[#f4511e]"
                        : "border-zinc-200 text-zinc-700 hover:border-[#f4511e]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(value)}
                      onChange={() => toggleType(value)}
                      className="accent-[#f4511e]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="font-semibold text-zinc-900">Select format</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bookFormats.map((format) => (
                  <label
                    key={format.value}
                    className="flex cursor-pointer flex-col gap-1 rounded-2xl border border-zinc-200 px-4 py-3 text-left transition hover:border-[#f4511e]"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="format"
                        value={format.value}
                        checked={selectedFormat === format.value}
                        onChange={() => setSelectedFormat(format.value)}
                        className="accent-[#f4511e]"
                      />
                      <span className="font-semibold text-zinc-900">{format.label}</span>
                    </div>
                    <span className="text-xs text-zinc-500">{format.description}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="pages" className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
                  Pages
                </label>
                <input
                  id="pages"
                  type="number"
                  placeholder="200"
                  value={pages}
                  onChange={(event) => setPages(event.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-2 focus:border-[#f4511e] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="paper" className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
                  Paper stock
                </label>
                <select
                  id="paper"
                  className="w-full rounded-xl border border-zinc-200 px-4 py-2 focus:border-[#f4511e] focus:outline-none"
                  value={paper}
                  onChange={(event) => setPaper(event.target.value)}
                >
                  <option value="Matte 80g">Matte 80g</option>
                  <option value="Premium 90g">Premium 90g</option>
                  <option value="Glossy 120g">Glossy 120g</option>
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="finish" className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
                  Finish
                </label>
                <select
                  id="finish"
                  className="w-full rounded-xl border border-zinc-200 px-4 py-2 focus:border-[#f4511e] focus:outline-none"
                  value={finish}
                  onChange={(event) => setFinish(event.target.value)}
                >
                  <option value="Soft touch">Soft touch</option>
                  <option value="Gloss lamination">Gloss lamination</option>
                  <option value="Matte lamination">Matte lamination</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
                  Print price (USD)
                </label>
                <input
                  type="number"
                  value={printPrice}
                  onChange={(event) => setPrintPrice(event.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-2 focus:border-[#f4511e] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
                  eBook price (USD)
                </label>
                <input
                  type="number"
                  value={ebookPrice}
                  onChange={(event) => setEbookPrice(event.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-2 focus:border-[#f4511e] focus:outline-none"
                />
              </div>
            </div>

            <button className="w-full rounded-2xl bg-gradient-to-r from-[#7827c7] to-[#f4511e] py-3 text-base font-semibold text-white shadow-lg transition hover:shadow-xl">
              Simulate pricing
            </button>
          </div>
        </section>

        <aside className="rounded-3xl bg-white p-8 shadow-xl lg:w-[360px]">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#7827c7]">
            Preview
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900">
            Estimated launch summary
          </h2>
          <p className="mt-3 text-sm text-zinc-500">
            Fields you enter on the left will populate this live preview. Start with publication
            type or format to see a tailored summary.
          </p>

          {showPreview ? (
            <div className="mt-8 space-y-5 text-sm">
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5 text-zinc-700">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
                  Publication types
                </p>
                <p className="mt-2 font-semibold text-zinc-900">
                  {selectedTypes.length > 0 ? selectedTypes.join(" · ") : "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5 text-zinc-700">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
                  Format & Specs
                </p>
                <p className="mt-2 text-zinc-900">
                  {selectedFormatLabel?.label} · {selectedFormatLabel?.description}
                </p>
                <p className="text-xs text-zinc-500">
                  {pages || "—"} pages · {paper} · {finish}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5 text-zinc-700">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
                  Pricing intent
                </p>
                <p className="mt-2 text-zinc-900">
                  Print ${printPrice || "0.00"} / eBook ${ebookPrice || "0.00"}
                </p>
                <p className="text-xs text-zinc-500">
                  Add distribution preferences once you talk with our team.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-10 flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 text-center text-sm text-zinc-500">
              <div className="h-16 w-12 rounded-lg border-2 border-zinc-300"></div>
              <p className="mt-4 max-w-xs">
                Your launch preview will appear here once you start filling out the form.
              </p>
            </div>
          )}

          <Link
            href="/services/start"
            className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-[#f4511e] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#d74415]"
          >
            Talk with an editor
          </Link>
        </aside>
      </div>
    </main>
  );
}
