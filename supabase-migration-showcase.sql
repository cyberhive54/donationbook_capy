-- Showcase feature tables
create table if not exists albums (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references festivals(id) on delete cascade,
  title text not null,
  description text,
  year int,
  cover_url text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_albums_festival on albums(festival_id);
create index if not exists idx_albums_year on albums(year);

create type media_kind as enum ('image','video','audio','pdf','other');

create table if not exists media_items (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references albums(id) on delete cascade,
  type media_kind not null,
  title text,
  description text,
  url text not null,
  mime_type text,
  size_bytes bigint,
  duration_sec int,
  thumbnail_url text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_media_album on media_items(album_id);
create index if not exists idx_media_type on media_items(type);

-- Note: Create a public storage bucket named 'showcase' in Supabase Storage and make it public.
-- App will upload files to storage and persist public URLs in media_items.url.
