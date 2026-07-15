-- Stripe Managed Payments integration.
--
-- 1. published_books gets Stripe product/price references so we create each
--    book's Stripe Product/Price once (lazily, on first purchase) and reuse
--    it afterwards rather than re-creating it on every checkout.
--
-- 2. Closes a known trust gap: previously the browser client could flip its
--    own order straight to 'paid' (see 20260712120000_orders_and_checkout_schema.sql's
--    comment). Now only the stripe-webhook Edge Function -- which runs with
--    the service role key after verifying Stripe's webhook signature -- is
--    allowed to make that transition. A regular authenticated client update
--    attempting to set status='paid' is rejected by this trigger.

alter table public.published_books
  add column if not exists stripe_product_id text,
  add column if not exists stripe_price_id text;

create or replace function public.guard_order_paid_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'paid' and old.status <> 'paid' and auth.role() <> 'service_role' then
    raise exception 'orders.status may only be set to paid by the payment webhook';
  end if;
  return new;
end;
$$;

create trigger trg_guard_order_paid_transition
  before update of status on public.orders
  for each row execute function public.guard_order_paid_transition();
