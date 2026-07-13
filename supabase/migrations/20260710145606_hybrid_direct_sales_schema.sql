-- Hybrid affiliate + direct-sales schema for Indie Converters.
--
-- The existing catalogue already has public.authors, public.books, and
-- public.book_retailer_links. This migration extends those tables instead of
-- recreating them, then adds the accounting tables needed for direct sales,
-- payment-method fees, author payout batching, and distributor notifications.

-- Enumerations keep the model queryable without free-text status drift.
do $$ begin
  create type public.book_type as enum ('affiliate', 'published');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_fee_type as enum ('flat', 'percentage', 'hybrid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_parse_status as enum ('pending', 'processed', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payout_status as enum ('pending', 'completed', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.invoice_status as enum ('pending', 'approved', 'paid');
exception when duplicate_object then null; end $$;

-- AUTHORS
-- Existing columns: id, slug, display_name, short_bio, long_bio, website_url,
-- photo_url, created_at, user_id. The columns below support payout/contact
-- workflows while preserving existing catalogue reads.
alter table public.authors
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists account_balance numeric(12,2) not null default 0;

update public.authors
set name = display_name
where name is null;

do $$ begin
  alter table public.authors
    add constraint authors_account_balance_non_negative
    check (account_balance >= 0);
exception when duplicate_object then null; end $$;

create or replace function public.sync_author_name_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.name is null and new.display_name is not null then
      new.name := new.display_name;
    end if;

    if (new.display_name is null or new.display_name = '') and new.name is not null then
      new.display_name := new.name;
    end if;
  else
    if new.name is distinct from old.name
      and (new.display_name is null or new.display_name = old.display_name) then
      new.display_name := new.name;
    elsif new.display_name is distinct from old.display_name
      and (new.name is null or new.name = old.name) then
      new.name := new.display_name;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_author_name_fields on public.authors;
create trigger trg_sync_author_name_fields
before insert or update of name, display_name on public.authors
for each row execute function public.sync_author_name_fields();

comment on column public.authors.name is 'Author display name used by direct-sales and payout workflows. Kept in sync with display_name for compatibility.';
comment on column public.authors.email is 'Author contact email for sales, payout, and distributor notification workflows.';
comment on column public.authors.account_balance is 'Cached payable author balance. Sales and payouts remain the source of truth.';

-- BOOKS
-- Existing public.books is the catalogue record. The direct-sales fields below
-- identify the commercial path and canonical payout author without removing
-- the existing many-to-many books_authors relationship.
alter table public.books
  add column if not exists author_id uuid references public.authors(id) on delete set null,
  add column if not exists isbn text,
  add column if not exists book_type public.book_type not null default 'affiliate',
  add column if not exists cover_image_url text;

update public.books b
set author_id = picked.author_id
from (
  select distinct on (ba.book_id)
    ba.book_id,
    ba.author_id
  from public.books_authors ba
  order by ba.book_id, ba.position asc, ba.author_id
) picked
where b.id = picked.book_id
  and b.author_id is null;

update public.books
set isbn = coalesce(isbn13, isbn10)
where isbn is null;

update public.books
set cover_image_url = cover_url
where cover_image_url is null
  and cover_url is not null;

comment on column public.books.author_id is 'Canonical payout/owner author for direct-sale accounting. Existing books_authors still supports contributor display.';
comment on column public.books.isbn is 'Primary ISBN used in sales and distribution workflows; mirrors isbn13/isbn10 when available.';
comment on column public.books.book_type is 'affiliate redirects to external retailers; published is sold directly or payout-tracked by Indie Converters.';
comment on column public.books.cover_image_url is 'Commerce-facing cover URL. Kept separate from cover_url for compatibility with existing catalogue UI.';

-- DISTRIBUTORS
-- A distributor is the sales/reporting source for published-book sales. This
-- can be Indie Converters Shop, Draft2Digital, Amazon, Apple Books, etc.
create table if not exists public.distributors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  default_commission_rate numeric(6,5) not null default 0,
  notification_email_format text,
  created_at timestamptz not null default now(),
  constraint distributors_default_commission_rate_range
    check (default_commission_rate >= 0 and default_commission_rate <= 1)
);

comment on table public.distributors is 'Sales/reporting channels used to identify distributor cuts and parse incoming sale notifications.';
comment on column public.distributors.default_commission_rate is 'Default distributor cut as a decimal, e.g. 0.30000 for 30%. Actual sales still capture the per-sale percentage.';
comment on column public.distributors.notification_email_format is 'Optional parser hint or template name for sale notification emails from this distributor.';

-- AFFILIATE BOOKS
-- Affiliate books redirect out to retailers. We may earn commission, but these
-- rows are not part of author payout processing.
create table if not exists public.affiliate_books (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null unique references public.books(id) on delete cascade,
  external_retailer_url text not null,
  affiliate_link text not null,
  commission_rate numeric(6,5) not null default 0,
  constraint affiliate_books_commission_rate_range
    check (commission_rate >= 0 and commission_rate <= 1)
);

comment on table public.affiliate_books is 'Affiliate-commerce details for catalogue books that redirect to external retailers.';
comment on column public.affiliate_books.commission_rate is 'Expected affiliate commission as a decimal. This is platform revenue, not an author payout rate.';

-- PUBLISHED BOOKS
-- Published books are sold directly or payout-tracked through Indie Converters.
create table if not exists public.published_books (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null unique references public.books(id) on delete cascade,
  list_price numeric(10,2) not null,
  author_royalty_rate numeric(6,5) not null default 0.80000,
  constraint published_books_list_price_non_negative
    check (list_price >= 0),
  constraint published_books_author_royalty_rate_range
    check (author_royalty_rate >= 0 and author_royalty_rate <= 1)
);

comment on table public.published_books is 'Direct-sale settings for books sold or payout-tracked by Indie Converters.';
comment on column public.published_books.author_royalty_rate is 'Author royalty rate as a decimal after distributor/platform cuts, e.g. 0.80000 for 80%.';

create or replace function public.assert_commercial_book_type()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  actual_type public.book_type;
begin
  select b.book_type into actual_type
  from public.books b
  where b.id = new.book_id;

  if actual_type is null then
    raise exception 'Book % does not exist or has no book_type', new.book_id;
  end if;

  if actual_type::text <> tg_argv[0] then
    raise exception 'Book % must have book_type %, found %', new.book_id, tg_argv[0], actual_type;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_affiliate_books_match_book_type on public.affiliate_books;
create trigger trg_affiliate_books_match_book_type
before insert or update of book_id on public.affiliate_books
for each row execute function public.assert_commercial_book_type('affiliate');

drop trigger if exists trg_published_books_match_book_type on public.published_books;
create trigger trg_published_books_match_book_type
before insert or update of book_id on public.published_books
for each row execute function public.assert_commercial_book_type('published');

-- PAYMENT METHODS
-- Payment methods describe payout fee formulas. Payout rows reference one
-- method, so fees can be calculated from method settings rather than hardcoded.
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  fee_type public.payment_fee_type not null,
  flat_fee_amount numeric(10,2) not null default 0,
  percentage_fee numeric(6,5) not null default 0,
  constraint payment_methods_flat_fee_non_negative
    check (flat_fee_amount >= 0),
  constraint payment_methods_percentage_fee_range
    check (percentage_fee >= 0 and percentage_fee <= 1)
);

comment on table public.payment_methods is 'Available author payout methods and their fee formulas, such as Stripe, PayPal, or bank transfer.';
comment on column public.payment_methods.fee_type is 'flat, percentage, or hybrid fee formula.';
comment on column public.payment_methods.percentage_fee is 'Percentage payout fee as a decimal, e.g. 0.02900 for 2.9%.';

-- AUTHOR PAYMENT METHODS
-- account_details_reference should point to a tokenized/provider-side reference,
-- not raw bank, card, or PayPal credentials.
create table if not exists public.author_payment_methods (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.authors(id) on delete cascade,
  payment_method_id uuid not null references public.payment_methods(id) on delete restrict,
  account_details_reference text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.author_payment_methods is 'Author payout options. Stores provider references only, allowing authors to keep multiple payout methods and select a default.';
comment on column public.author_payment_methods.account_details_reference is 'Tokenized payment-provider reference. Do not store raw bank/card credentials here.';

-- NOTIFICATIONS
-- Raw distributor email/webhook payloads land here first, then parser jobs can
-- create one or more sales rows.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid not null references public.distributors(id) on delete restrict,
  raw_email_content text not null,
  parsed_status public.notification_parse_status not null default 'pending',
  received_at timestamptz not null default now()
);

comment on table public.notifications is 'Raw distributor sale notifications before and after parsing.';
comment on column public.notifications.parsed_status is 'pending while queued, processed after sales are created, failed if parsing needs review.';

-- SALES
-- Sales are payout-tracked published-book sales. Affiliate redirect earnings
-- should be handled separately because no author payout processing is needed.
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete restrict,
  distributor_id uuid not null references public.distributors(id) on delete restrict,
  sale_amount numeric(10,2) not null,
  distributor_cut_percentage numeric(6,5) not null default 0,
  net_amount_to_author numeric(10,2)
    generated always as (round((sale_amount * (1 - distributor_cut_percentage)), 2)) stored,
  sale_date timestamptz not null default now(),
  source_notification_id uuid references public.notifications(id) on delete set null,
  constraint sales_sale_amount_non_negative
    check (sale_amount >= 0),
  constraint sales_distributor_cut_percentage_range
    check (distributor_cut_percentage >= 0 and distributor_cut_percentage <= 1)
);

comment on table public.sales is 'Individual payout-tracked sales for published books. Each row traces to book, canonical author, distributor, and optional source notification.';
comment on column public.sales.distributor_cut_percentage is 'Distributor cut captured per sale because the rate can vary by distributor, format, territory, or campaign.';
comment on column public.sales.net_amount_to_author is 'Generated from sale_amount minus distributor_cut_percentage. Payout method fees are calculated later on payouts.';

create or replace function public.ensure_sale_book_is_published_with_author()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  sale_book public.books%rowtype;
begin
  select * into sale_book
  from public.books b
  where b.id = new.book_id;

  if sale_book.id is null then
    raise exception 'Sale book % does not exist', new.book_id;
  end if;

  if sale_book.book_type <> 'published' then
    raise exception 'Sales can only be recorded for published books. Book % is %', new.book_id, sale_book.book_type;
  end if;

  if not exists (
    select 1
    from public.published_books pb
    where pb.book_id = new.book_id
  ) then
    raise exception 'Published sale book % must have a published_books row', new.book_id;
  end if;

  if sale_book.author_id is null then
    raise exception 'Published sale book % must have books.author_id for author payout traceability', new.book_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sales_book_traceability on public.sales;
create trigger trg_sales_book_traceability
before insert or update of book_id on public.sales
for each row execute function public.ensure_sale_book_is_published_with_author();

-- PAYOUTS
-- Payout rows capture a payout run. Sales included in that payout are linked
-- through payout_sales so monthly or threshold-triggered batches remain auditable.
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.authors(id) on delete restrict,
  payment_method_id uuid not null references public.payment_methods(id) on delete restrict,
  total_amount numeric(12,2) not null,
  fee_deducted numeric(12,2) not null default 0,
  net_amount_sent numeric(12,2) not null default 0,
  status public.payout_status not null default 'pending',
  payout_date timestamptz,
  created_at timestamptz not null default now(),
  constraint payouts_total_amount_non_negative
    check (total_amount >= 0),
  constraint payouts_fee_deducted_non_negative
    check (fee_deducted >= 0),
  constraint payouts_net_amount_sent_non_negative
    check (net_amount_sent >= 0)
);

comment on table public.payouts is 'Author payout batches. Amounts are tied to one payment method and linked back to covered sales via payout_sales.';
comment on column public.payouts.total_amount is 'Gross payout amount before payout-method fees.';
comment on column public.payouts.fee_deducted is 'Calculated from payment_methods for the selected payment_method_id.';
comment on column public.payouts.net_amount_sent is 'total_amount minus fee_deducted.';

create or replace function public.calculate_payment_method_fee(
  p_payment_method_id uuid,
  p_total_amount numeric
)
returns numeric
language sql
stable
set search_path = ''
as $$
  select case pm.fee_type
    when 'flat' then pm.flat_fee_amount
    when 'percentage' then round((p_total_amount * pm.percentage_fee), 2)
    when 'hybrid' then round((pm.flat_fee_amount + (p_total_amount * pm.percentage_fee)), 2)
  end
  from public.payment_methods pm
  where pm.id = p_payment_method_id;
$$;

comment on function public.calculate_payment_method_fee(uuid, numeric) is 'Calculates payout fees from the selected payment_methods row rather than hardcoded payout logic.';

create or replace function public.set_payout_amounts_from_payment_method()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.fee_deducted := coalesce(
    public.calculate_payment_method_fee(new.payment_method_id, new.total_amount),
    0
  );
  new.net_amount_sent := round((new.total_amount - new.fee_deducted), 2);

  if new.net_amount_sent < 0 then
    raise exception 'Payout fee % exceeds total_amount %', new.fee_deducted, new.total_amount;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_payout_amounts on public.payouts;
create trigger trg_set_payout_amounts
before insert or update of payment_method_id, total_amount on public.payouts
for each row execute function public.set_payout_amounts_from_payment_method();

-- PAYOUT SALES
-- Junction table linking each payout to the individual sales it covers.
create table if not exists public.payout_sales (
  id uuid primary key default gen_random_uuid(),
  payout_id uuid not null references public.payouts(id) on delete cascade,
  sale_id uuid not null unique references public.sales(id) on delete restrict,
  created_at timestamptz not null default now()
);

comment on table public.payout_sales is 'Auditable link between payout batches and the individual sales paid in each batch.';
comment on column public.payout_sales.sale_id is 'Unique so a sale can only be included in one payout batch.';

create or replace function public.ensure_payout_sale_author_match()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  payout_author_id uuid;
  sale_author_id uuid;
begin
  select p.author_id into payout_author_id
  from public.payouts p
  where p.id = new.payout_id;

  select b.author_id into sale_author_id
  from public.sales s
  join public.books b on b.id = s.book_id
  where s.id = new.sale_id;

  if payout_author_id is null then
    raise exception 'Payout % does not exist', new.payout_id;
  end if;

  if sale_author_id is null then
    raise exception 'Sale % does not trace to a book author', new.sale_id;
  end if;

  if payout_author_id <> sale_author_id then
    raise exception 'Sale % belongs to author %, not payout author %', new.sale_id, sale_author_id, payout_author_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_payout_sales_author_match on public.payout_sales;
create trigger trg_payout_sales_author_match
before insert or update of payout_id, sale_id on public.payout_sales
for each row execute function public.ensure_payout_sale_author_match();

-- INVOICES
-- Used for author-requested withdrawals before a scheduled threshold/monthly
-- payout job processes the payment.
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.authors(id) on delete restrict,
  requested_amount numeric(12,2) not null,
  threshold_met_at timestamptz,
  status public.invoice_status not null default 'pending',
  created_at timestamptz not null default now(),
  constraint invoices_requested_amount_positive
    check (requested_amount > 0)
);

comment on table public.invoices is 'On-demand author withdrawal requests before scheduled threshold-triggered payouts are processed.';
comment on column public.invoices.threshold_met_at is 'When the author balance met the configured withdrawal threshold, if applicable.';

-- Indexes for foreign keys and frequent dashboard/reporting queries.
create index if not exists idx_authors_email on public.authors(email);
create index if not exists idx_books_author_id on public.books(author_id);
create index if not exists idx_books_book_type on public.books(book_type);
create index if not exists idx_books_isbn on public.books(isbn);
create index if not exists idx_affiliate_books_book_id on public.affiliate_books(book_id);
create index if not exists idx_published_books_book_id on public.published_books(book_id);
create index if not exists idx_author_payment_methods_author_id on public.author_payment_methods(author_id);
create index if not exists idx_author_payment_methods_payment_method_id on public.author_payment_methods(payment_method_id);
create unique index if not exists idx_author_payment_methods_one_default
  on public.author_payment_methods(author_id)
  where is_default;
create index if not exists idx_notifications_distributor_id on public.notifications(distributor_id);
create index if not exists idx_notifications_status_received_at on public.notifications(parsed_status, received_at);
create index if not exists idx_sales_book_id on public.sales(book_id);
create index if not exists idx_sales_distributor_id on public.sales(distributor_id);
create index if not exists idx_sales_sale_date on public.sales(sale_date);
create index if not exists idx_sales_source_notification_id on public.sales(source_notification_id);
create index if not exists idx_payouts_author_id on public.payouts(author_id);
create index if not exists idx_payouts_payment_method_id on public.payouts(payment_method_id);
create index if not exists idx_payouts_status_payout_date on public.payouts(status, payout_date);
create index if not exists idx_payout_sales_payout_id on public.payout_sales(payout_id);
create index if not exists idx_payout_sales_sale_id on public.payout_sales(sale_id);
create index if not exists idx_invoices_author_id on public.invoices(author_id);
create index if not exists idx_invoices_status_created_at on public.invoices(status, created_at);

-- RLS
-- Financial tables live in public for Supabase compatibility, so RLS is enabled.
-- Service-role/admin processes handle writes; authors can read/manage only rows
-- tied to their own author profile where that is useful in the dashboard.
alter table public.distributors enable row level security;
alter table public.affiliate_books enable row level security;
alter table public.published_books enable row level security;
alter table public.payment_methods enable row level security;
alter table public.author_payment_methods enable row level security;
alter table public.notifications enable row level security;
alter table public.sales enable row level security;
alter table public.payouts enable row level security;
alter table public.payout_sales enable row level security;
alter table public.invoices enable row level security;

drop policy if exists "public_read_affiliate_books_for_published_catalogue" on public.affiliate_books;
create policy "public_read_affiliate_books_for_published_catalogue"
  on public.affiliate_books for select
  to anon, authenticated
  using (exists (
    select 1
    from public.books b
    where b.id = affiliate_books.book_id
      and b.is_published is true
  ));

drop policy if exists "public_read_published_books_for_published_catalogue" on public.published_books;
create policy "public_read_published_books_for_published_catalogue"
  on public.published_books for select
  to anon, authenticated
  using (exists (
    select 1
    from public.books b
    where b.id = published_books.book_id
      and b.is_published is true
  ));

drop policy if exists "authenticated_read_distributors" on public.distributors;
create policy "authenticated_read_distributors"
  on public.distributors for select
  to authenticated
  using (true);

drop policy if exists "authenticated_read_payment_methods" on public.payment_methods;
create policy "authenticated_read_payment_methods"
  on public.payment_methods for select
  to authenticated
  using (true);

drop policy if exists "authors_manage_own_payment_methods" on public.author_payment_methods;
create policy "authors_manage_own_payment_methods"
  on public.author_payment_methods for all
  to authenticated
  using (exists (
    select 1
    from public.authors a
    where a.id = author_payment_methods.author_id
      and a.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1
    from public.authors a
    where a.id = author_payment_methods.author_id
      and a.user_id = (select auth.uid())
  ));

drop policy if exists "authors_read_own_sales" on public.sales;
create policy "authors_read_own_sales"
  on public.sales for select
  to authenticated
  using (exists (
    select 1
    from public.books b
    left join public.authors a on a.id = b.author_id
    where b.id = sales.book_id
      and (
        b.author_user_id = (select auth.uid())
        or a.user_id = (select auth.uid())
      )
  ));

drop policy if exists "authors_read_own_payouts" on public.payouts;
create policy "authors_read_own_payouts"
  on public.payouts for select
  to authenticated
  using (exists (
    select 1
    from public.authors a
    where a.id = payouts.author_id
      and a.user_id = (select auth.uid())
  ));

drop policy if exists "authors_read_own_payout_sales" on public.payout_sales;
create policy "authors_read_own_payout_sales"
  on public.payout_sales for select
  to authenticated
  using (exists (
    select 1
    from public.payouts p
    join public.authors a on a.id = p.author_id
    where p.id = payout_sales.payout_id
      and a.user_id = (select auth.uid())
  ));

drop policy if exists "authors_manage_own_invoices" on public.invoices;
create policy "authors_manage_own_invoices"
  on public.invoices for all
  to authenticated
  using (exists (
    select 1
    from public.authors a
    where a.id = invoices.author_id
      and a.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1
    from public.authors a
    where a.id = invoices.author_id
      and a.user_id = (select auth.uid())
  ));

-- notifications intentionally has no author-facing policy. Raw distributor
-- payloads should be handled by service-role ingestion/parsing jobs only.
