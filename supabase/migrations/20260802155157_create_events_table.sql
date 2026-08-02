create table public.events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  location text not null,
  event_datetime timestamptz not null,
  capacity integer not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.events is '모임 이벤트 관리 웹 MVP - 주최자가 생성하는 모임(수영/헬스/친구모임 등) 정보';

create trigger events_updated_at
  before update on public.events
  for each row
  execute function public.handle_updated_at();

alter table public.events enable row level security;

create policy "모임은 로그인한 사용자에게 공개된다"
  on public.events for select
  to authenticated
  using (true);

create policy "주최자는 자신의 모임을 생성할 수 있다"
  on public.events for insert
  to authenticated
  with check (auth.uid() = host_id);

create policy "주최자는 자신의 모임을 수정할 수 있다"
  on public.events for update
  to authenticated
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

create policy "주최자는 자신의 모임을 삭제할 수 있다"
  on public.events for delete
  to authenticated
  using (auth.uid() = host_id);
