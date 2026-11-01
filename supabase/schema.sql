-- Tabela única: um documento JSON por usuário. Rode no SQL Editor do Supabase.
create table if not exists public.user_data (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.user_data enable row level security;
drop policy if exists "dono" on public.user_data;
create policy "dono" on public.user_data for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
