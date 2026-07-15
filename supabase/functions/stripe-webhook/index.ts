// Verifies Stripe webhook signatures and is the *only* thing allowed to
// mark an order 'paid' (enforced independently by a DB trigger too -- see
// migration 20260713110000_stripe_managed_payments.sql).

import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@18';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('Missing stripe-signature header', { status: 400 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed', err);
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;

    if (!orderId) {
      console.error('[stripe-webhook] checkout.session.completed with no order_id metadata', session.id);
      return new Response('ok', { status: 200 }); // ack anyway -- nothing we can do with it
    }

    if (session.payment_status !== 'paid') {
      console.warn('[stripe-webhook] session completed but not paid', session.id, session.payment_status);
      return new Response('ok', { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error } = await supabase
      .from('orders')
      .update({ status: 'paid', paid_at: new Date().toISOString(), payment_reference: session.id })
      .eq('id', orderId);

    if (error) {
      console.error('[stripe-webhook] failed to mark order paid', orderId, error);
      return new Response('Failed to update order', { status: 500 });
    }

    // Clear the cart now that payment is confirmed.
    const userId = session.metadata?.user_id;
    if (userId) {
      const { data: cart } = await supabase.from('carts').select('id').eq('user_id', userId).maybeSingle();
      if (cart) await supabase.from('cart_items').delete().eq('cart_id', cart.id);
    }
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
});
