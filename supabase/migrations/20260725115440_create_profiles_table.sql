-- 사용자 프로필 테이블. id는 auth.users.id를 그대로 사용한다(1:1).
create table public.profiles (
  id uuid not null primary key references auth.users (id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  bio text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint username_length check (char_length(username) >= 3)
);

alter table public.profiles enable row level security;

create policy "사용자는 본인 프로필을 조회할 수 있다"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "사용자는 본인 프로필을 추가할 수 있다"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "사용자는 본인 프로필을 수정할 수 있다"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "사용자는 본인 프로필을 삭제할 수 있다"
on public.profiles
for delete
to authenticated
using (auth.uid() = id);
