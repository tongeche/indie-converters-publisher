// Creates a Stripe Managed Payments Checkout Session for the caller's cart.
//
// Security note: prices are never trusted from the client. This function
// re-derives every line item's price from published_books.list_price (the
// source of truth) at call time, and lazily creates/reuses a Stripe
// Product+Price per book, caching the ids back onto published_books so we
// don't recreate them on every checkout.
//
// The order + order_items rows are created here (status: 'pending'). Only
// the stripe-webhook function is allowed to flip an order to 'paid' (see
// migration 20260713110000_stripe_managed_payments.sql).

import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@18';

const MANAGED_PAYMENTS_API_VERSION = '2026-02-25.preview';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    // Client used to identify the caller from their own JWT.
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !user) throw new Error('Not authenticated');

    // Service-role client for everything else (bypasses RLS deliberately --
    // this function is the trusted price/order authority).
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { origin } = await req.json().catch(() => ({ origin: null }));
    const safeOrigin = origin || req.headers.get('origin') || '';

    // 1. Load the caller's cart.
    const { data: cart, error: cartErr } = await supabase
      .from('carts').select('id').eq('user_id', user.id).maybeSingle();
    if (cartErr) throw cartErr;
    if (!cart) throw new Error('No cart found');

    const { data: cartItems, error: itemsErr } = await supabase
      .from('cart_items')
      .select('id, item_id, quantity')
      .eq('cart_id', cart.id)
      .eq('item_type', 'book');
    if (itemsErr) throw itemsErr;
    if (!cartItems?.length) throw new Error('Cart is empty');

    // 2. Re-derive real prices from published_books (never trust cart_items.price).
    const bookIds = cartItems.map(i => i.item_id);
    const { data: pubBooks, error: pubErr } = await supabase
      .from('published_books')
      .select('id, book_id, list_price, stripe_product_id, stripe_price_id, books ( title )')
      .in('book_id', bookIds);
    if (pubErr) throw pubErr;

    const pubByBookId = new Map((pubBooks || []).map(pb => [pb.book_id, pb]));

    let subtotal = 0;
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const orderItemRows: { book_id: string; title: string; unit_price: number; quantity: number }[] = [];

    for (const item of cartItems) {
      const pub = pubByBookId.get(item.item_id);
      if (!pub) throw new Error(`Book ${item.item_id} is not a direct-sale title`);

      const unitAmount = Math.round(Number(pub.list_price) * 100); // cents
      const title = pub.books?.title || 'Untitled';

      let { stripe_product_id: productId, stripe_price_id: priceId } = pub;

      // Lazily create the Stripe Product/Price, or re-create the Price if
      // the book's price has changed since it was last cached (Stripe
      // Prices are immutable -- a price change means a new Price object).
      let needsNewPrice = !productId || !priceId;
      if (priceId && !needsNewPrice) {
        const existingPrice = await stripe.prices.retrieve(priceId);
        if (existingPrice.unit_amount !== unitAmount || existingPrice.currency !== 'usd') {
          needsNewPrice = true;
        }
      }

      if (!productId) {
        const product = await stripe.products.create(
          {
            name: title,
            description: `${title} — ebook via Indie Converters`,
            tax_code: 'txcd_10103100', // digital goods (ebook)
            default_price_data: { unit_amount: unitAmount, currency: 'usd' },
          },
          { apiVersion: MANAGED_PAYMENTS_API_VERSION },
        );
        productId = product.id;
        priceId = typeof product.default_price === 'string' ? product.default_price : product.default_price!.id;
      } else if (needsNewPrice) {
        const price = await stripe.prices.create({ product: productId, unit_amount: unitAmount, currency: 'usd' });
        priceId = price.id;
        await stripe.products.update(productId, { default_price: priceId });
      }

      if (productId !== pub.stripe_product_id || priceId !== pub.stripe_price_id) {
        await supabase
          .from('published_books')
          .update({ stripe_product_id: productId, stripe_price_id: priceId })
          .eq('id', pub.id);
      }

      lineItems.push({ price: priceId, quantity: item.quantity });
      orderItemRows.push({ book_id: item.item_id, title, unit_price: Number(pub.list_price), quantity: item.quantity });
      subtotal += Number(pub.list_price) * item.quantity;
    }

    // 3. Create the pending order + order_items using server-verified prices.
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({ user_id: user.id, status: 'pending', currency: 'USD', subtotal, total: subtotal, payment_provider: 'stripe' })
      .select('id').single();
    if (orderErr) throw orderErr;

    const { error: orderItemsErr } = await supabase
      .from('order_items')
      .insert(orderItemRows.map(row => ({ order_id: order.id, ...row })));
    if (orderItemsErr) throw orderItemsErr;

    // 4. Create the Managed Payments Checkout Session.
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: lineItems,
        managed_payments: { enabled: true },
        metadata: { order_id: order.id, user_id: user.id },
        success_url: `${safeOrigin}/order/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${safeOrigin}/cart`,
      } as Stripe.Checkout.SessionCreateParams,
      { apiVersion: MANAGED_PAYMENTS_API_VERSION },
    );

    await supabase.from('orders').update({ payment_reference: session.id }).eq('id', order.id);

    return new Response(JSON.stringify({ url: session.url, orderId: order.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[create-checkout-session]', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
