-- highestbid.lol — initial schema
-- Rank is the bid. Nothing else.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- listings

create table if not exists listings (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  url          text not null,
  url_key      text not null unique,          -- normalized url, one listing per product
  domain       text not null,
  title        text not null,
  description  text,
  favicon_url  text,

  bid_value    numeric(12,2) not null default 0,   -- what your rank is based on
  total_paid   numeric(12,2) not null default 0,   -- lifetime spend, never goes down
  decay_anchor timestamptz   not null default now(), -- reserved: "the melt" lands here

  clicks       integer not null default 0,
  status       text not null default 'pending'
                 check (status in ('pending', 'live', 'hidden')),

  manage_token uuid not null default gen_random_uuid(),

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------- bids

create table if not exists bids (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings(id) on delete cascade,
  amount      numeric(12,2) not null check (amount > 0),
  checkout_id text unique,                    -- polar checkout id; webhook idempotency
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- clicks

create table if not exists click_events (
  id         bigserial primary key,
  listing_id uuid not null references listings(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- sponsor slots

create table if not exists sponsor_slots (
  id         uuid primary key default gen_random_uuid(),
  position   text not null check (position in ('left', 'right')),
  listing_id uuid references listings(id) on delete set null,
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- indexes

create index if not exists listings_board_idx
  on listings (bid_value desc, created_at asc) where status = 'live';
create index if not exists bids_recent_idx        on bids (created_at desc);
create index if not exists click_events_recent_idx on click_events (created_at desc);
create index if not exists sponsor_active_idx      on sponsor_slots (position, ends_at desc);

-- ---------------------------------------------------------------- board view

create or replace view board
with (security_invoker = true) as
select
  l.id, l.slug, l.url, l.domain, l.title, l.description, l.favicon_url,
  l.bid_value, l.clicks, l.created_at,
  row_number() over (order by l.bid_value desc, l.created_at asc)::int as rank
from listings l
where l.status = 'live';

create or replace view site_stats
with (security_invoker = true) as
select
  (select coalesce(sum(total_paid), 0) from listings)                  as revenue,
  (select count(*) from listings where status = 'live')                as live_listings,
  (select count(*) from listings)                                      as total_listings,
  (select coalesce(sum(clicks), 0) from listings)                      as total_clicks;

-- ---------------------------------------------------------------- apply a paid bid
-- Idempotent on checkout_id: Polar retries webhooks, and a retry must not
-- double-charge the board.

create or replace function apply_bid(
  p_listing_id  uuid,
  p_amount      numeric,
  p_checkout_id text
) returns listings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bid_id  uuid;
  v_listing listings;
begin
  insert into bids (listing_id, amount, checkout_id)
  values (p_listing_id, p_amount, p_checkout_id)
  on conflict (checkout_id) do nothing
  returning id into v_bid_id;

  -- already processed this checkout; return current state untouched
  if v_bid_id is null then
    select * into v_listing from listings where id = p_listing_id;
    return v_listing;
  end if;

  update listings
     set bid_value    = bid_value + p_amount,
         total_paid   = total_paid + p_amount,
         decay_anchor = now(),
         status       = 'live',
         updated_at   = now()
   where id = p_listing_id
  returning * into v_listing;

  return v_listing;
end;
$$;

create or replace function register_click(p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  update listings set clicks = clicks + 1
   where slug = p_slug and status = 'live'
  returning id into v_id;

  if v_id is not null then
    insert into click_events (listing_id) values (v_id);
  end if;
end;
$$;

-- ---------------------------------------------------------------- rls
-- Everything public is read-only. All writes go through the service role.

alter table listings     enable row level security;
alter table bids         enable row level security;
alter table click_events enable row level security;
alter table sponsor_slots enable row level security;

drop policy if exists "public reads live listings" on listings;
create policy "public reads live listings" on listings
  for select using (status = 'live');

drop policy if exists "public reads bids" on bids;
create policy "public reads bids" on bids for select using (true);

drop policy if exists "public reads clicks" on click_events;
create policy "public reads clicks" on click_events for select using (true);

drop policy if exists "public reads sponsors" on sponsor_slots;
create policy "public reads sponsors" on sponsor_slots for select using (true);

-- manage_token is a bearer credential — never let the anon key read that column.
revoke all on listings from anon, authenticated;
grant select (
  id, slug, url, url_key, domain, title, description, favicon_url,
  bid_value, total_paid, clicks, status, created_at, updated_at
) on listings to anon, authenticated;

-- checkout_id is a payment-processor identifier; the board only needs the amount.
revoke all on bids from anon, authenticated;
grant select (id, listing_id, amount, created_at) on bids to anon, authenticated;
