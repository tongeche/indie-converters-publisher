"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { v4 as uuidv4 } from "uuid";

export type CartItem = {
  id: string;
  item_type: "book" | "service";
  item_id: string;
  title: string;
  price: number;
  image_url: string | null;
  description: string | null;
  quantity: number;
  format?: string | null;
};

type CartContextType = {
  items: CartItem[];
  loading: boolean;
  cartCount: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartId, setCartId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  // Get or create session ID for anonymous users
  const getSessionId = useCallback(() => {
    if (typeof window === "undefined") return null;
    
    let sessionId = localStorage.getItem("cart_session_id");
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem("cart_session_id", sessionId);
    }
    return sessionId;
  }, []);

  // Load cart items
  const loadCart = useCallback(async () => {
    if (initialized) return; // Prevent multiple loads
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = getSessionId();

      // Try to find existing cart
      let query = supabase.from("carts").select("id").limit(1);
      
      if (user) {
        query = query.eq("user_id", user.id);
      } else if (sessionId) {
        query = query.eq("session_id", sessionId);
      } else {
        setItems([]);
        setLoading(false);
        setInitialized(true);
        return;
      }

      const { data: existingCart } = await query.single();

      let currentCartId = existingCart?.id || null;

      // Create new cart if it doesn't exist
      if (!currentCartId) {
        const { data: newCart, error } = await supabase
          .from("carts")
          .insert({
            user_id: user?.id || null,
            session_id: user ? null : sessionId,
          })
          .select("id")
          .single();

        if (error) {
          console.error("Error creating cart:", error);
          setItems([]);
          setLoading(false);
          setInitialized(true);
          return;
        }

        currentCartId = newCart.id;
      }

      setCartId(currentCartId);

      // Load cart items
      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .eq("cart_id", currentCartId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading cart:", error);
        setItems([]);
      } else {
        setItems(data || []);
      }
    } catch (error) {
      console.error("Error in loadCart:", error);
      setItems([]);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [initialized, supabase, getSessionId]);

  // Load cart on mount only once
  useEffect(() => {
    if (!initialized) {
      loadCart();
    }
  }, [initialized, loadCart]);

  // Remove item from cart
  const removeItem = useCallback(async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) {
        console.error("Error removing item:", error);
        throw error;
      }

      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("Error in removeItem:", error);
      throw error;
    }
  }, [supabase]);

  // Update item quantity
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeItem(itemId);
      return;
    }

    try {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", itemId);

      if (error) {
        console.error("Error updating quantity:", error);
        throw error;
      }

      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
      );
    } catch (error) {
      console.error("Error in updateQuantity:", error);
      throw error;
    }
  }, [supabase, removeItem]);

  // Add item to cart
  const addItem = useCallback(async (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => {
    try {
      let currentCartId = cartId;
      
      // Create cart if it doesn't exist
      if (!currentCartId) {
        const { data: { user } } = await supabase.auth.getUser();
        const sessionId = getSessionId();

        const { data: newCart, error } = await supabase
          .from("carts")
          .insert({
            user_id: user?.id || null,
            session_id: user ? null : sessionId,
          })
          .select("id")
          .single();

        if (error || !newCart) {
          console.error("Error creating cart:", error);
          throw new Error("Could not create cart");
        }

        currentCartId = newCart.id;
        setCartId(currentCartId);
      }

      // Check if item already exists
      const existingItem = items.find(
        (i) =>
          i.item_type === item.item_type &&
          i.item_id === item.item_id &&
          i.format === item.format
      );

      if (existingItem) {
        // Update quantity
        await updateQuantity(existingItem.id, existingItem.quantity + (item.quantity || 1));
      } else {
        // Insert new item
        const { error } = await supabase.from("cart_items").insert({
          cart_id: currentCartId,
          item_type: item.item_type,
          item_id: item.item_id,
          title: item.title,
          price: item.price,
          image_url: item.image_url,
          description: item.description,
          quantity: item.quantity || 1,
          format: item.format,
        });

        if (error) {
          console.error("Error adding item to cart:", error);
          throw error;
        }

        // Reload cart items
        const { data } = await supabase
          .from("cart_items")
          .select("*")
          .eq("cart_id", currentCartId)
          .order("created_at", { ascending: false });

        setItems(data || []);
      }
    } catch (error) {
      console.error("Error in addItem:", error);
      throw error;
    }
  }, [cartId, items, supabase, getSessionId, updateQuantity]);

  // Clear cart
  const clearCart = useCallback(async () => {
    if (!cartId) return;

    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("cart_id", cartId);

      if (error) {
        console.error("Error clearing cart:", error);
        throw error;
      }

      setItems([]);
    } catch (error) {
      console.error("Error in clearCart:", error);
      throw error;
    }
  }, [cartId, supabase]);

  // Refresh cart (allows manual reload)
  const refreshCart = useCallback(async () => {
    if (!cartId) return;
    
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .eq("cart_id", cartId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error refreshing cart:", error);
      } else {
        setItems(data || []);
      }
    } catch (error) {
      console.error("Error in refreshCart:", error);
    }
  }, [cartId, supabase]);

  // Computed values
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value: CartContextType = {
    items,
    loading,
    cartCount,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
