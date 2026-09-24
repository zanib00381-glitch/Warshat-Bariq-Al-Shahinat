-- UPD Card Generator — Supabase schema
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.

create table if not exists public.upd_cards (
  -- Short, URL-safe public id used in the verification link: /verify/<id>
  id                       text primary key check (id ~ '^[0-9A-Za-z]{12}$'),

  -- Manufacturer info: defaults mirror src/config/company.ts, but each card
  -- stores its own copy so historical cards stay accurate if details change.
  manufacturer_name        text not null default 'ورشة بريق الشاحنات',
  manufacturer_code        text not null default 'E30',
  country_of_origin        text not null default 'السعودية',
  date_of_manufacture      date not null,
  technical_references     text not null default 'اللائحة الفنية للحواجز الأمامية والخلفية والجانبية للشاحنات والمقطورات',

  -- Vehicle info
  vehicle_model_name       text not null,
  vehicle_brand            text not null,
  vehicle_model_year       text not null check (vehicle_model_year ~ '^\d{4}$'),
  upd_type                 text not null check (upd_type ~ '^[SRF](/[SRF]){0,2}$'),
  vehicle_chassis_number   text not null,

  -- Distinguished Under-Run Number (16 printed cells)
  under_run_number_prefix  text not null,  -- cells 1-7:  "KSA" + manufacturer code + UPD type
  under_run_number_suffix  text not null check (under_run_number_suffix ~ '^[A-Z0-9]{9}$'),  -- cells 8-16
  under_run_number_full    text not null,
  constraint upd_cards_under_run_number_full_key unique (under_run_number_full),
  constraint upd_cards_under_run_number_consistent
    check (under_run_number_full = under_run_number_prefix || under_run_number_suffix),

  card_issue_date          date not null default ((now() at time zone 'Asia/Riyadh')::date),
  created_at               timestamptz not null default now(),
  created_by               text,
  qr_url                   text not null
);

create index if not exists upd_cards_created_at_idx on public.upd_cards (created_at desc);
create index if not exists upd_cards_chassis_idx on public.upd_cards (vehicle_chassis_number);

-- Lock the table down: RLS on with no policies means the anon key can neither
-- read nor write. The app accesses it server-side with the service-role key.
alter table public.upd_cards enable row level security;
