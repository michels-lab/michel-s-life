create table public.ml_state (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  snapshot jsonb not null default '{}'::jsonb,
  revision bigint not null default 1 check (revision >= 1),
  source_device_id text not null default '',
  source_platform text not null default 'unknown' check (source_platform in ('windows','android','other')),
  app_version text not null default '',
  updated_at timestamptz not null default now()
);

create table public.ml_state_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  snapshot jsonb not null,
  revision bigint not null check (revision >= 1),
  source_device_id text not null default '',
  source_platform text not null default 'unknown' check (source_platform in ('windows','android','other')),
  app_version text not null default '',
  reason text not null default 'sync',
  created_at timestamptz not null default now()
);

create table public.ml_devices (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  device_id text not null,
  platform text not null check (platform in ('windows','android','other')),
  label text not null default '',
  app_version text not null default '',
  last_action text not null default 'connected',
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, device_id)
);

create index ml_state_history_user_created_idx
  on public.ml_state_history (user_id, created_at desc);

create index ml_devices_user_seen_idx
  on public.ml_devices (user_id, last_seen_at desc);

alter table public.ml_state enable row level security;
alter table public.ml_state_history enable row level security;
alter table public.ml_devices enable row level security;

grant select, insert, update, delete on public.ml_state to authenticated;
grant select, insert, update, delete on public.ml_state_history to authenticated;
grant select, insert, update, delete on public.ml_devices to authenticated;

create policy ml_state_select_own on public.ml_state
for select to authenticated using ((select auth.uid()) = user_id);
create policy ml_state_insert_own on public.ml_state
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy ml_state_update_own on public.ml_state
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy ml_state_delete_own on public.ml_state
for delete to authenticated using ((select auth.uid()) = user_id);

create policy ml_state_history_select_own on public.ml_state_history
for select to authenticated using ((select auth.uid()) = user_id);
create policy ml_state_history_insert_own on public.ml_state_history
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy ml_state_history_delete_own on public.ml_state_history
for delete to authenticated using ((select auth.uid()) = user_id);

create policy ml_devices_select_own on public.ml_devices
for select to authenticated using ((select auth.uid()) = user_id);
create policy ml_devices_insert_own on public.ml_devices
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy ml_devices_update_own on public.ml_devices
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy ml_devices_delete_own on public.ml_devices
for delete to authenticated using ((select auth.uid()) = user_id);
