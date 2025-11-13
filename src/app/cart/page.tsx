import Image from "next/image";
import Link from "next/link";

const sampleItem = {
  title: "Wolf So Grim and Mangy",
  price: 249.0,
  description:
    "Premium print cover artwork tailored to your brand. Provide your manuscript and we'll deliver a full jacket that stands out on every shelf.",
  sustainability:
    "Printed on FSC-certified paper with vegetable inks. Ships in recycled packaging.",
  coverUrl:
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80",
};

export default function CartPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f5] py-12 px-4 sm:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-lg sm:p-10">
        <div className="mb-8 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">
          Free delivery and free returns.
        </div>

        <div className="flex flex-col gap-6 border-b border-zinc-200 pb-8 sm:flex-row sm:items-start">
          <div className="flex flex-shrink-0 items-center gap-4">
            <div className="relative h-32 w-24 overflow-hidden rounded-xl bg-zinc-100">
              <Image
                src={sampleItem.coverUrl}
                alt={sampleItem.title}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-zinc-900">
                  {sampleItem.title}
                </h1>
                <p className="text-sm text-zinc-500">Details & Care</p>
              </div>

              <div className="flex items-center gap-3 text-sm text-[#c94c23]">
                <label className="flex items-center gap-1 text-zinc-500">
                  Qty
                  <select className="rounded border border-zinc-200 bg-transparent px-2 py-1 focus:outline-none">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </label>
                <div className="text-lg font-semibold text-zinc-900">
                  ${sampleItem.price.toFixed(2)}
                </div>
              </div>
            </div>

            <p className="text-sm text-zinc-600">{sampleItem.description}</p>
            <p className="text-sm text-zinc-500">
              <span className="font-semibold text-zinc-700">Sustainability:</span>{" "}
              {sampleItem.sustainability}
            </p>
            <button className="self-start text-sm font-semibold text-[#c94c23]">
              Remove
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-2 text-sm text-zinc-600">
          <div className="flex items-center justify-between border-b border-dashed border-zinc-200 pb-4">
            <span>Subtotal</span>
            <span className="text-base font-semibold text-zinc-900">
              ${sampleItem.price.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-dashed border-zinc-200 pb-4">
            <span>Shipping</span>
            <span className="text-base font-semibold text-green-600">Free</span>
          </div>
          <div className="flex items-center justify-between text-base font-bold text-zinc-900">
            <span>Total</span>
            <span>${sampleItem.price.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/checkout"
            className="inline-flex w-full items-center justify-center rounded-full bg-[#f06523] px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-[#d64d12] sm:w-auto"
          >
            Checkout
          </Link>
          <button className="text-sm font-semibold text-[#c94c23]">
            Get daily cash with Nespole card →
          </button>
        </div>
      </div>
    </main>
  );
}
