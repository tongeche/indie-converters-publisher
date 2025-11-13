"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart/CartContext";

type Props = {
  bookId: string;
  title: string;
  price: number;
  coverUrl: string | null;
  description?: string | null;
  format?: string | null;
};

export function BookAddToCartButton({
  bookId,
  title,
  price,
  coverUrl,
  description,
  format,
}: Props) {
  const { addItem } = useCart();
  const [status, setStatus] = useState<"idle" | "loading" | "added" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const handleAddToCart = async () => {
    if (status === "loading") return;
    setStatus("loading");
    setError(null);
    try {
      await addItem({
        item_type: "book",
        item_id: bookId,
        title,
        price,
        image_url: coverUrl,
        description: description ?? null,
        format: format ?? null,
      });
      setStatus("added");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      console.error(err);
      setError("Could not add book to your cart. Please try again.");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={status === "loading"}
        className="inline-flex items-center justify-center rounded-full bg-[#F4511E] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d74415] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" && "Adding..."}
        {status === "added" && "Added ✅"}
        {status === "error" && "Try Again"}
        {status === "idle" && "Add to Cart"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {status === "added" && (
        <p className="text-xs text-emerald-600">Book added to your cart.</p>
      )}
    </div>
  );
}
