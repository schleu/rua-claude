-- ============================================================
-- Acessibilidade Urbana — Schema Supabase (PostgreSQL + PostGIS)
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- Extensão para dados geoespaciais
create extension if not exists postgis;

-- ── Profiles (estende auth.users do Supabase) ───────────────
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text,
  mobility_type text check (mobility_type in ('wheelchair','cane','walker','low_vision','full')),
  avatar_url  text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Perfil público visível" on public.profiles
  for select using (true);

create policy "Usuário edita próprio perfil" on public.profiles
  for update using (auth.uid() = id);

-- Trigger: cria perfil automaticamente ao cadastrar
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, mobility_type)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'mobility_type'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Obstacles ────────────────────────────────────────────────
create table if not exists public.obstacles (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete set null,
  latitude      double precision not null,
  longitude     double precision not null,
  location      geography(Point, 4326) generated always as (
                  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
                ) stored,
  type          text not null check (type in ('hole','uneven','construction','pole','step','no_ramp','other')),
  description   text,
  photo_url     text,
  confirmations int default 0,
  resolved      boolean default false,
  created_at    timestamptz default now()
);

create index if not exists obstacles_location_idx on public.obstacles using gist(location);
create index if not exists obstacles_resolved_idx on public.obstacles(resolved);

alter table public.obstacles enable row level security;

create policy "Obstáculos visíveis a todos" on public.obstacles
  for select using (true);

create policy "Usuário autenticado cria obstáculo" on public.obstacles
  for insert with check (auth.uid() = user_id);

create policy "Usuário atualiza próprio obstáculo" on public.obstacles
  for update using (auth.uid() = user_id);

-- ── Places ────────────────────────────────────────────────────
create table if not exists public.places (
  id          uuid default gen_random_uuid() primary key,
  created_by  uuid references auth.users(id) on delete set null,
  name        text not null,
  latitude    double precision not null,
  longitude   double precision not null,
  location    geography(Point, 4326) generated always as (
                ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
              ) stored,
  address     text,
  category    text check (category in ('commerce','health','education','transport','other')),
  created_at  timestamptz default now()
);

create index if not exists places_location_idx on public.places using gist(location);

alter table public.places enable row level security;

create policy "Locais visíveis a todos" on public.places
  for select using (true);

create policy "Usuário autenticado adiciona local" on public.places
  for insert with check (auth.uid() = created_by);

-- ── Reviews ────────────────────────────────────────────────────
create table if not exists public.reviews (
  id                   uuid default gen_random_uuid() primary key,
  place_id             uuid references public.places(id) on delete cascade not null,
  user_id              uuid references auth.users(id) on delete set null,
  rating_ramp          int not null check (rating_ramp between 1 and 5),
  rating_bathroom      int not null check (rating_bathroom between 1 and 5),
  rating_parking       int not null check (rating_parking between 1 and 5),
  rating_tactile_floor int not null check (rating_tactile_floor between 1 and 5),
  avg_rating           numeric(3,2) not null,
  comment              text,
  photo_url            text,
  created_at           timestamptz default now(),
  unique (place_id, user_id)  -- uma avaliação por usuário por local
);

alter table public.reviews enable row level security;

create policy "Avaliações visíveis a todos" on public.reviews
  for select using (true);

create policy "Usuário autenticado avalia" on public.reviews
  for insert with check (auth.uid() = user_id);

create policy "Usuário edita própria avaliação" on public.reviews
  for update using (auth.uid() = user_id);

-- ── View: média por local ──────────────────────────────────────
create or replace view public.places_with_rating as
select
  p.*,
  round(avg(r.avg_rating)::numeric, 2) as avg_rating,
  count(r.id)::int                     as review_count
from public.places p
left join public.reviews r on r.place_id = p.id
group by p.id;

-- ═══════════════════════════════════════════════════════════════
-- STORAGE — buckets para fotos
-- ═══════════════════════════════════════════════════════════════

-- Criar buckets públicos (execute no painel do Supabase → Storage → New bucket)
-- OU via SQL:
insert into storage.buckets (id, name, public)
values
  ('obstacles', 'obstacles', true),
  ('reviews',   'reviews',   true)
on conflict (id) do nothing;

-- Políticas de storage: qualquer um pode ver, autenticados podem fazer upload
create policy "Fotos de obstáculos visíveis" on storage.objects
  for select using (bucket_id = 'obstacles');

create policy "Usuário autenticado envia foto de obstáculo" on storage.objects
  for insert with check (bucket_id = 'obstacles' and auth.role() = 'authenticated');

create policy "Fotos de avaliações visíveis" on storage.objects
  for select using (bucket_id = 'reviews');

create policy "Usuário autenticado envia foto de avaliação" on storage.objects
  for insert with check (bucket_id = 'reviews' and auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════════
-- REALTIME — habilitar publicação das tabelas
-- ═══════════════════════════════════════════════════════════════

-- Adicionar tabelas ao canal realtime
alter publication supabase_realtime add table public.obstacles;
alter publication supabase_realtime add table public.reviews;

-- ═══════════════════════════════════════════════════════════════
-- DADOS DE EXEMPLO — Fortaleza, CE
-- Execute após criar as tabelas para ver o app funcionando
-- ═══════════════════════════════════════════════════════════════

insert into public.places (name, latitude, longitude, address, category) values
  ('Shopping Iguatemi Fortaleza',   -3.7438, -38.4882, 'Av. Washington Soares, 85 - Edson Queiroz',       'commerce'),
  ('Hospital das Clínicas - UFC',   -3.7436, -38.5479, 'R. Prof. Costa Mendes, 1608 - Rodolfo Teófilo',   'health'),
  ('Terminal Rodoviário de Fortaleza',-3.7195,-38.5318,'Av. Borges de Melo, 1630 - Fátima',               'transport'),
  ('Mercado Central de Fortaleza',  -3.7238, -38.5294, 'R. Conde d''Eu, s/n - Centro',                    'commerce'),
  ('UFC - Campus do Pici',          -3.7461, -38.5753, 'Av. Mister Hull, s/n - Pici',                     'education')
on conflict do nothing;

insert into public.obstacles (user_id, latitude, longitude, type, description, confirmations)
select
  null,
  lat, lng, tipo, descricao, confs
from (values
  (-3.7285, -38.5298, 'hole',         'Buraco grande na calçada próximo ao calçadão', 5),
  (-3.7319, -38.5267, 'no_ramp',      'Esquina sem rampa de acesso para cadeirantes', 8),
  (-3.7201, -38.5310, 'construction', 'Obra bloqueando metade da calçada',            3),
  (-3.7438, -38.4882, 'step',         'Degrau alto na entrada do shopping',           2),
  (-3.7350, -38.5100, 'uneven',       'Piso irregular e escorregadio',                4)
) as t(lat, lng, tipo, descricao, confs)
on conflict do nothing;
