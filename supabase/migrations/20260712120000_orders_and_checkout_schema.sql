-- Orders/checkout schema for the public-facing shop.
--
-- public.sales (from the hybrid direct-sales migration) is an author-payout
-- ledger — one row per unit sold, feeding payouts. It has no buyer identity
-- or payment status, so it isn't a checkout record. This migration adds a
-- thin orders/order_items layer in front of it: when an order's status
-- transitions to 'paid', a trigger generates the matching sales row(s) for
-- any published-book line items, so the existing Sales dashboard and future
-- payout pipeline need no changes.
--
-- Checkout is simulated for now (no real payment provider wired in yet):
-- orders are created 'pending', then flipped to 'paid' by the client in the
-- same session. When Stripe (or similar) is added later, that final status
-- flip moves to a webhook running with the service role, and the "paid"
-- update policy below should be tightened to remove client-side access.

do $$ begin
  create type public.order_status as enum ('pending', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  status public.order_status not null default 'pending',
  currency text not null default 'USD',
  subtotal numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  payment_provider text not null default 'simulated',
  payment_reference text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  constraint orders_subtotal_non_negative check (subtotal >= 0),
  constraint orders_total_non_negative check (total >= 0)
);

comment on table public.orders is 'Public-shop checkout transactions. payment_provider is "simulated" until real payments are wired in.';
comment on column public.orders.payment_reference is 'Payment-provider transaction/session id once real payments are wired in. Null for simulated orders.';

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete restrict,
  title text not null,
  unit_price numeric(10,2) not null,
  quantity integer not null default 1,
  constraint order_items_unit_price_non_negative check (unit_price >= 0),
  constraint order_items_quantity_positive check (quantity > 0)
);

comment on table public.order_items is 'Line items for an order. title/unit_price are cached at purchase time so later price changes do not rewrite history.';

-- The originating order for a sale, when sold directly through the shop
-- (as opposed to source_notification_id, which traces a distributor-email-
-- parsed sale). Exactly one of the two should be set in practice.
alter table public.sales
  add column if not exists source_order_id uuid references public.orders(id) on delete set null;

comment on column public.sales.source_order_id is 'Order that generated this sale when sold directly through the Indie Converters shop.';

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_book_id on public.order_items(book_id);
create index if not exists idx_sales_source_order_id on public.sales(source_order_id);

-- On transition into 'paid', create one sales row per published-book line
-- item. Fires on the status UPDATE (not on insert), so order_items always
-- exist by the time it runs regardless of how many statements the client
-- issues.
create or replace function public.create_sales_from_paid_order()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  distributor record;
  item record;
begin
  if new.status <> 'paid' or old.status = 'paid' then
    return new;
  end if;

  select id, default_commission_rate into distributor
  from public.distributors
  where name = 'Indie Converters Shop';

  if distributor.id is null then
    raise exception 'Indie Converters Shop distributor is not configured';
  end if;

  for item in
    select oi.book_id, oi.unit_price, oi.quantity
    from public.order_items oi
    join public.books b on b.id = oi.book_id
    where oi.order_id = new.id
      and b.book_type = 'published'
  loop
    insert into public.sales (
      book_id, distributor_id, sale_amount, distributor_cut_percentage,
      sale_date, source_order_id
    )
    values (
      item.book_id, distributor.id, item.unit_price * item.quantity,
      distributor.default_commission_rate,
      coalesce(new.paid_at, now()), new.id
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_create_sales_from_paid_order on public.orders;
create trigger trg_create_sales_from_paid_order
after update of status on public.orders
for each row execute function public.create_sales_from_paid_order();

-- RLS
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "users_manage_own_orders" on public.orders;
create policy "users_manage_own_orders"
  on public.orders for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "users_manage_own_order_items" on public.order_items;
create policy "users_manage_own_order_items"
  on public.order_items for all
  to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = (select auth.uid())
  ));

-- NOTE: because there is no real payment provider yet, the policy above lets
-- a buyer's own client flip their own order to 'paid' with no server-side
-- verification. This is a deliberate, temporary trust gap for the
-- simulation phase. When a real payment provider is wired in, replace the
-- "paid" transition path with a service-role-only webhook and restrict this
-- policy so authenticated users can no longer set status = 'paid' directly.
