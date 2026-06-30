-- Shopping cart tables

-- Cart table (one per user)
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id text, -- For anonymous users
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Ensure one cart per user or session
  unique(user_id),
  unique(session_id)
);

-- Cart items (books, services, etc.)
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references public.carts(id) on delete cascade not null,
  
  -- Item reference (either a book or service)
  item_type text not null check (item_type in ('book', 'service')),
  item_id uuid not null, -- References books.id or services.id
  
  -- Item details (cached for display)
  title text not null,
  price numeric(10, 2) not null,
  image_url text,
  description text,
  
  -- Cart item specifics
  quantity int default 1 check (quantity > 0),
  format text, -- For books: 'Hardcover', 'Paperback', 'eBook', 'Audiobook'
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Prevent duplicate items (same book/service with same format)
  unique(cart_id, item_type, item_id, format)
);

-- Indexes for performance
create index if not exists cart_items_cart_id_idx on public.cart_items(cart_id);
create index if not exists carts_user_id_idx on public.carts(user_id);
create index if not exists carts_session_id_idx on public.carts(session_id);

-- Updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_carts_updated_at before update on public.carts
  for each row execute function public.update_updated_at_column();

create trigger update_cart_items_updated_at before update on public.cart_items
  for each row execute function public.update_updated_at_column();

-- RLS policies
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

-- Cart policies
create policy "Users can view their own cart"
  on public.carts for select
  using (
    auth.uid() = user_id or
    session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
  );

create policy "Users can create their own cart"
  on public.carts for insert
  with check (
    auth.uid() = user_id or
    session_id is not null
  );

create policy "Users can update their own cart"
  on public.carts for update
  using (
    auth.uid() = user_id or
    session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
  );

create policy "Users can delete their own cart"
  on public.carts for delete
  using (
    auth.uid() = user_id or
    session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
  );

-- Cart items policies
create policy "Users can view items in their cart"
  on public.cart_items for select
  using (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
        and (carts.user_id = auth.uid() or carts.session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  );

create policy "Users can add items to their cart"
  on public.cart_items for insert
  with check (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
        and (carts.user_id = auth.uid() or carts.session_id is not null)
    )
  );

create policy "Users can update items in their cart"
  on public.cart_items for update
  using (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
        and (carts.user_id = auth.uid() or carts.session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  );

create policy "Users can delete items from their cart"
  on public.cart_items for delete
  using (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
        and (carts.user_id = auth.uid() or carts.session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  );
