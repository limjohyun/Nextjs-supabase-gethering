create table public.carpools (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  driver_id uuid not null references public.profiles (id) on delete cascade,
  departure_location text not null,
  departure_time timestamptz not null,
  seat_count integer not null check (seat_count >= 1),
  created_at timestamptz not null default now()
);

comment on table public.carpools is '모임 카풀 - 참여자가 등록하는 카풀 정보(운전자/출발지/시간/좌석수)';

alter table public.carpools enable row level security;

create policy "운전자 본인/주최자/승인된 참여자는 카풀을 조회할 수 있다"
  on public.carpools for select
  to authenticated
  using (
    auth.uid() = driver_id
    or auth.uid() = (select host_id from public.events where id = event_id)
    or exists (
      select 1 from public.event_participants
      where event_id = carpools.event_id
        and user_id = auth.uid()
        and status = 'approved'
    )
  );

create policy "로그인 사용자는 자신을 운전자로 카풀을 등록할 수 있다"
  on public.carpools for insert
  to authenticated
  with check (auth.uid() = driver_id);

create policy "운전자는 자신의 카풀을 수정할 수 있다"
  on public.carpools for update
  to authenticated
  using (auth.uid() = driver_id)
  with check (auth.uid() = driver_id);

create table public.carpool_requests (
  id uuid primary key default gen_random_uuid(),
  carpool_id uuid not null references public.carpools (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'confirmed')),
  applied_at timestamptz not null default now()
);

comment on table public.carpool_requests is '카풀 좌석 신청 - 1건당 1석, 참여자는 여러 번 신청 가능';

alter table public.carpool_requests enable row level security;

create policy "신청자 본인/운전자/주최자/승인된 참여자는 좌석 신청을 조회할 수 있다"
  on public.carpool_requests for select
  to authenticated
  using (
    auth.uid() = user_id
    or auth.uid() = (select driver_id from public.carpools where id = carpool_id)
    or auth.uid() = (
      select e.host_id from public.events e
      join public.carpools c on c.event_id = e.id
      where c.id = carpool_requests.carpool_id
    )
    or exists (
      select 1 from public.event_participants ep
      join public.carpools c on c.event_id = ep.event_id
      where c.id = carpool_requests.carpool_id
        and ep.user_id = auth.uid()
        and ep.status = 'approved'
    )
  );

create policy "로그인 사용자는 자신의 이름으로 좌석을 신청할 수 있다"
  on public.carpool_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 카풀 운전자가 좌석 신청을 확정하는 유일한 공식 경로.
-- carpools 행을 SELECT ... FOR UPDATE로 잠가 동시 확정 요청이 들어와도
-- seat_count를 초과해 확정되지 않도록 직렬화한다.
create or replace function public.confirm_carpool_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_carpool_id uuid;
  v_seat_count integer;
  v_confirmed_count integer;
begin
  select carpool_id into v_carpool_id
  from carpool_requests
  where id = request_id;

  if v_carpool_id is null then
    raise exception '존재하지 않는 신청입니다.';
  end if;

  select seat_count into v_seat_count
  from carpools
  where id = v_carpool_id and driver_id = auth.uid()
  for update;

  if not found then
    raise exception '해당 카풀의 운전자만 확정할 수 있습니다.';
  end if;

  select count(*) into v_confirmed_count
  from carpool_requests
  where carpool_id = v_carpool_id and status = 'confirmed';

  if v_confirmed_count >= v_seat_count then
    raise exception '좌석이 모두 찼습니다.';
  end if;

  update carpool_requests
  set status = 'confirmed'
  where id = request_id;
end;
$$;

comment on function public.confirm_carpool_request(uuid) is '카풀 운전자가 좌석 신청을 확정하는 유일한 공식 경로. carpools 행을 잠가 동시 확정 요청 시 seat_count 초과를 방지한다.';

revoke all on function public.confirm_carpool_request(uuid) from public, anon;
grant execute on function public.confirm_carpool_request(uuid) to authenticated;
