create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

comment on table public.announcements is '모임 공지 - 주최자가 작성하고 승인된 참여자가 조회';

alter table public.announcements enable row level security;

create policy "주최자 또는 승인된 참여자는 공지를 조회할 수 있다"
  on public.announcements for select
  to authenticated
  using (
    auth.uid() = (select host_id from public.events where id = event_id)
    or exists (
      select 1 from public.event_participants
      where event_id = announcements.event_id
        and user_id = auth.uid()
        and status = 'approved'
    )
  );

create policy "주최자는 공지를 작성할 수 있다"
  on public.announcements for insert
  to authenticated
  with check (auth.uid() = (select host_id from public.events where id = event_id));
