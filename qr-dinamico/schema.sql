-----------------------------------------------------------------------------
--  Dynamic QR SaaS — Database Schema (Supabase / PostgreSQL)
--  Run this in the Supabase SQL editor to bootstrap the database.
-----------------------------------------------------------------------------

-- Enable the pgcrypto extension for gen_random_uuid()
create extension if not exists "pgcrypto";

-----------------------------------------------------------------------------
--  Table: qr_codes
--  Stores the configuration of every dynamic QR code.
-----------------------------------------------------------------------------
create table public.qr_codes (
  id            uuid  primary key default gen_random_uuid(),
  user_id       uuid  references auth.users on delete cascade not null,
  name          text  not null,
  slug          text  unique not null,
  target_url    text  not null,
  primary_color text  not null default '#000000',
  logo_url      text,
  is_active     boolean not null default true,
  created_at    timestamp with time zone not null default now()
);

-----------------------------------------------------------------------------
--  Table: qr_analytics
--  Stores scan events for analytics.
-----------------------------------------------------------------------------
create table public.qr_analytics (
  id         uuid  primary key default gen_random_uuid(),
  qr_id      uuid  references public.qr_codes on delete cascade not null,
  device_os  text,
  scanned_at timestamp with time zone not null default now()
);

-- Indexes for query performance
create index if not exists idx_qr_analytics_qr_id     on public.qr_analytics(qr_id);
create index if not exists idx_qr_analytics_scanned_at on public.qr_analytics(scanned_at);
create index if not exists idx_qr_codes_user_id      on public.qr_codes(user_id);
create index if not exists idx_qr_codes_slug         on public.qr_codes(slug);

-----------------------------------------------------------------------------
--  Row-Level Security (RLS)
-----------------------------------------------------------------------------

alter table public.qr_codes     enable row level security;
alter table public.qr_analytics enable row level security;

-----------------------------------------------------------------------------
--  Policies: qr_codes
-----------------------------------------------------------------------------

-- 1. A user can view only their own QR codes.
create policy "Users can view their own qr_codes"
  on public.qr_codes
  for select
  using (auth.uid() = user_id);

-- 2. A user can create QR codes for themselves.
create policy "Users can create their own qr_codes"
  on public.qr_codes
  for insert
  with check (auth.uid() = user_id);

-- 3. A user can update only their own QR codes.
create policy "Users can update their own qr_codes"
  on public.qr_codes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. A user can delete only their own QR codes.
create policy "Users can delete their own qr_codes"
  on public.qr_codes
  for delete
  using (auth.uid() = user_id);

-- 5. Public read access for active QR codes.
--    This policy allows the redirect endpoint (/r/[slug]) to look up the
--    target_url without authentication.  Only active codes are visible.
create policy "Public can read active qr_codes (for redirects)"
  on public.qr_codes
  for select
  using (is_active = true);

-----------------------------------------------------------------------------
--  Policies: qr_analytics
-----------------------------------------------------------------------------

-- 1. A user can view analytics for their own QR codes (via join to qr_codes).
create policy "Users can view analytics for their own qr_codes"
  on public.qr_analytics
  for select
  using (
    exists (
      select 1
      from public.qr_codes
      where qr_codes.id = qr_analytics.qr_id
        and qr_codes.user_id = auth.uid()
    )
  );

-- 2. Public insert access for scan analytics.
--    The redirect endpoint records scans on behalf of anonymous visitors.
--    The qr_id is validated by the foreign-key constraint to qr_codes,
--    so only valid QR codes can be tracked.
create policy "Public can insert qr_analytics"
  on public.qr_analytics
  for insert
  with check (true);
