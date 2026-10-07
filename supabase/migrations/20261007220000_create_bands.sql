-- Bands and membership. Direct writes are denied; create_band inserts the owner.

create table public.bands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  constraint bands_name_check check (
    name = btrim(name)
    and char_length(name) between 1 and 80
  )
);

create table public.band_members (
  band_id uuid not null references public.bands (id),
  user_id uuid not null references auth.users (id),
  role text not null,
  created_at timestamptz not null default now(),
  primary key (band_id, user_id),
  constraint band_members_role_check check (role in ('owner', 'member'))
);

create unique index band_members_one_owner_per_band
  on public.band_members (band_id)
  where role = 'owner';

alter table public.bands enable row level security;
alter table public.band_members enable row level security;

create policy band_members_select_own
  on public.band_members
  for select
  using (user_id = auth.uid());

create policy bands_select_member
  on public.bands
  for select
  using (
    exists (
      select 1
      from public.band_members
      where band_members.band_id = bands.id
        and band_members.user_id = auth.uid()
    )
  );

create policy bands_insert_denied
  on public.bands
  for insert
  with check (false);

create policy bands_update_denied
  on public.bands
  for update
  using (false)
  with check (false);

create policy bands_delete_denied
  on public.bands
  for delete
  using (false);

create policy band_members_insert_denied
  on public.band_members
  for insert
  with check (false);

create policy band_members_update_denied
  on public.band_members
  for update
  using (false)
  with check (false);

create policy band_members_delete_denied
  on public.band_members
  for delete
  using (false);

create function public.create_band(band_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid;
  trimmed_name text;
  new_band_id uuid;
begin
  caller_id := auth.uid();

  if caller_id is null then
    raise exception 'Not authenticated';
  end if;

  trimmed_name := btrim(band_name);

  if trimmed_name is null
    or char_length(trimmed_name) < 1
    or char_length(trimmed_name) > 80
  then
    raise exception 'Band name must be 1–80 characters';
  end if;

  insert into public.bands (name)
  values (trimmed_name)
  returning id into new_band_id;

  insert into public.band_members (band_id, user_id, role)
  values (new_band_id, caller_id, 'owner');

  return new_band_id;
end;
$$;

revoke execute on function public.create_band(text) from public;
revoke execute on function public.create_band(text) from anon;
revoke execute on function public.create_band(text) from service_role;
grant execute on function public.create_band(text) to authenticated;
