-- Security fix: orders/order_items were still governed by the original
-- "users_manage_own_*" FOR ALL policies (20260712120000_orders_and_checkout_schema.sql),
-- which let a buyer freely UPDATE/DELETE their own order_items (and non-status
-- columns of orders) via direct PostgREST calls with their own JWT.
--
-- That was fine when orders/order_items were client-created (the old simulated
-- checkout). It no longer is: create-checkout-session (service role) now
-- creates both rows with server-verified prices, and stripe-webhook (service
-- role) is the only thing that flips status to 'paid'. The client never needs
-- to write to either table anymore -- it only needs to read its own orders to
-- render order history / confirmation pages.
--
-- Without this, a buyer could zero out or delete their own order_items after
-- create-checkout-session creates them but before Stripe's webhook fires,
-- causing create_sales_from_paid_order() to under-credit (or skip crediting)
-- the author despite the buyer having paid full price via the immutable
-- Stripe Price object.
--
-- service_role bypasses RLS entirely, so the Edge Functions are unaffected.

drop policy if exists "users_manage_own_orders" on public.orders;
create policy "users_read_own_orders"
  on public.orders for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "users_manage_own_order_items" on public.order_items;
create policy "users_read_own_order_items"
  on public.order_items for select
  to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = (select auth.uid())
  ));
