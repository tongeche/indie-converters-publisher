"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useState } from "react";

export default function CartPage() {
  const { items, loading, cartCount, totalPrice, removeItem, updateQuantity } = useCart();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (itemId: string) => {
    setRemovingId(itemId);
    try {
      await removeItem(itemId);
    } catch (error) {
      console.error("Failed to remove item:", error);
    } finally {
      setRemovingId(null);
    }
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    try {
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center py-12">
            <p className="text-zinc-600">Loading your cart...</p>
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl bg-white p-12 text-center shadow-lg">
            <ShoppingBag className="mx-auto h-16 w-16 text-zinc-300" />
            <h1 className="mt-6 text-2xl font-bold text-zinc-900">Your cart is empty</h1>
            <p className="mt-3 text-zinc-600">
              Start shopping to add items to your cart.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/discover"
                className="rounded-full bg-[#461E89] px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-[#3a1770]"
              >
                Discover Books
              </Link>
              <Link
                href="/services"
                className="rounded-full border-2 border-[#461E89] px-8 py-3 text-base font-semibold text-[#461E89] transition hover:bg-purple-50"
              >
                Browse Services
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900">Shopping Cart</h1>
          <p className="mt-2 text-sm text-zinc-600">
            {cartCount} {cartCount === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-lg sm:p-10">
          <div className="mb-6 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">
            Free delivery and free returns.
          </div>

          <div className="space-y-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-6 border-b border-zinc-200 pb-6 last:border-0 sm:flex-row sm:items-start"
              >
                {/* Item Image */}
                <div className="flex-shrink-0">
                  <div className="relative h-32 w-24 overflow-hidden rounded-xl bg-zinc-100">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-400">
                        <ShoppingBag className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Item Details */}
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-zinc-900">
                        {item.title}
                      </h2>
                      <p className="text-sm text-zinc-500 capitalize">
                        {item.item_type} {item.format && `• ${item.format}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold text-zinc-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-sm text-zinc-600 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center font-medium text-zinc-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-zinc-600 transition hover:bg-zinc-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="text-sm text-zinc-500">
                      ${item.price.toFixed(2)} each
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={removingId === item.id}
                    className="flex items-center gap-2 self-start text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {removingId === item.id ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="mt-8 space-y-2 border-t border-zinc-200 pt-6 text-sm text-zinc-600">
            <div className="flex items-center justify-between pb-4">
              <span>Subtotal</span>
              <span className="text-base font-semibold text-zinc-900">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-zinc-200 pb-4">
              <span>Shipping</span>
              <span className="text-base font-semibold text-green-600">Free</span>
            </div>
            <div className="flex items-center justify-between pt-4 text-base font-bold text-zinc-900">
              <span>Total</span>
              <span className="text-2xl">${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout Buttons */}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/checkout"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#461E89] px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-[#3a1770] sm:w-auto"
            >
              Proceed to Checkout
            </Link>
            <Link
              href="/discover"
              className="text-center text-sm font-semibold text-[#461E89] transition hover:text-[#3a1770]"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
