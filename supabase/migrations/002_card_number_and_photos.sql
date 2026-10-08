-- Migration 002: "Barrier Unique ID Card" number, barrier pictures and vehicle type.
-- For databases created from an older schema.sql. Safe to run more than once.
-- Supabase dashboard → SQL Editor → New query → paste → Run.

-- 1. Unique 10-digit card number (existing cards get one automatically).
alter table public.upd_cards add column if not exists card_number text;

update public.upd_cards
set card_number = (1000000000 + floor(random() * 9000000000))::bigint::text
where card_number is null;

alter table public.upd_cards alter column card_number set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'upd_cards_card_number_key') then
    alter table public.upd_cards add constraint upd_cards_card_number_key unique (card_number);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'upd_cards_card_number_format') then
    alter table public.upd_cards add constraint upd_cards_card_number_format check (card_number ~ '^[1-9][0-9]{9}$');
  end if;
end $$;

-- 2. Barrier pictures. NULL = show the default picture.
alter table public.upd_cards add column if not exists side_photo_url text;
alter table public.upd_cards add column if not exists rear_photo_url text;

-- 3. Vehicle type (نوع المركبة); existing cards become 'شاحنة' (truck).
alter table public.upd_cards add column if not exists vehicle_type text not null default 'شاحنة';

-- 4. Public storage bucket for the pictures (max 3 MB, images only).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('barrier-photos', 'barrier-photos', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
