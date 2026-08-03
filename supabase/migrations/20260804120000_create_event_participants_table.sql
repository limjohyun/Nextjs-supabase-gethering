create table public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending',
  applied_at timestamptz not null default now(),
  unique (event_id, user_id)
);

comment on table public.event_participants is '모임 참여 신청 - 참여자의 참여 신청/승인/거절/취소 상태(pending/approved/rejected/cancelled)를 관리';

alter table public.event_participants enable row level security;

create policy "본인 또는 주최자는 참여 신청을 조회할 수 있다"
  on public.event_participants for select
  to authenticated
  using (
    auth.uid() = user_id
    or auth.uid() = (select host_id from public.events where id = event_id)
  );

create policy "로그인 사용자는 자신의 이름으로 참여 신청할 수 있다"
  on public.event_participants for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "주최자는 참여 신청을 승인/거절할 수 있다"
  on public.event_participants for update
  to authenticated
  using (auth.uid() = (select host_id from public.events where id = event_id))
  with check (auth.uid() = (select host_id from public.events where id = event_id));

create policy "참여자는 자신의 신청을 취소할 수 있다"
  on public.event_participants for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and status = 'cancelled');
