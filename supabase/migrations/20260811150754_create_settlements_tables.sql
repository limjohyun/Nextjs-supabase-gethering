create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  item_name text not null,
  payer_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null check (amount > 0),
  created_at timestamptz not null default now()
);

comment on table public.settlements is '모임 비용 항목 - 결제자가 여러 명이면 항목 금액을 결제자 수로 1/N 분할해 각 결제자 앞으로 개별 행을 만든다. item_id는 같은 등록에서 나온 분할 행들을 묶는 식별자. 생성은 register_settlement_item 함수를 통해서만 이뤄진다.';

alter table public.settlements enable row level security;

create policy "주최자/승인된 참여자는 비용 항목을 조회할 수 있다"
  on public.settlements for select
  to authenticated
  using (
    auth.uid() = (select host_id from public.events where id = event_id)
    or exists (
      select 1 from public.event_participants
      where event_id = settlements.event_id
        and user_id = auth.uid()
        and status = 'approved'
    )
  );

revoke insert, update, delete on public.settlements from authenticated, anon;

create table public.settlement_shares (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount_owed integer not null default 0,
  is_paid boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

comment on table public.settlement_shares is '모임 참여자별 정산 분담액. amount_owed는 register_settlement_item 함수가 재계산하며, is_paid는 주최자 또는 본인이 직접 갱신한다(컬럼 단위 권한으로 제한).';

alter table public.settlement_shares enable row level security;

create policy "주최자/승인된 참여자는 분담액을 조회할 수 있다"
  on public.settlement_shares for select
  to authenticated
  using (
    auth.uid() = (select host_id from public.events where id = event_id)
    or exists (
      select 1 from public.event_participants
      where event_id = settlement_shares.event_id
        and user_id = auth.uid()
        and status = 'approved'
    )
  );

create policy "주최자는 정산 완료 여부를 갱신할 수 있다"
  on public.settlement_shares for update
  to authenticated
  using (auth.uid() = (select host_id from public.events where id = event_id))
  with check (auth.uid() = (select host_id from public.events where id = event_id));

create policy "본인은 자신의 정산 완료 여부를 갱신할 수 있다"
  on public.settlement_shares for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke insert, update, delete on public.settlement_shares from authenticated, anon;
grant update (is_paid) on public.settlement_shares to authenticated;

create or replace function public.register_settlement_item(
  p_event_id uuid,
  p_item_name text,
  p_amount integer,
  p_payer_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id uuid := gen_random_uuid();
  v_payer_count integer;
  v_base integer;
  v_remainder integer;
  v_payer_id uuid;
  v_idx integer := 0;
  v_participant_count integer;
  v_total integer;
  v_share_base integer;
  v_share_remainder integer;
  v_participant record;
  v_pidx integer := 0;
begin
  if auth.uid() is null or auth.uid() <> (select host_id from events where id = p_event_id) then
    raise exception '주최자만 비용 항목을 등록할 수 있습니다.';
  end if;

  if p_item_name is null or length(trim(p_item_name)) = 0 then
    raise exception '항목명을 입력해주세요.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception '금액은 1원 이상이어야 합니다.';
  end if;

  v_payer_count := coalesce(array_length(p_payer_ids, 1), 0);
  if v_payer_count = 0 then
    raise exception '결제자를 1명 이상 선택해주세요.';
  end if;

  v_base := p_amount / v_payer_count;
  v_remainder := p_amount % v_payer_count;

  foreach v_payer_id in array p_payer_ids loop
    insert into settlements (item_id, event_id, item_name, payer_id, amount)
    values (
      v_item_id,
      p_event_id,
      p_item_name,
      v_payer_id,
      v_base + (case when v_idx < v_remainder then 1 else 0 end)
    );
    v_idx := v_idx + 1;
  end loop;

  select count(*) into v_participant_count
  from event_participants
  where event_id = p_event_id and status = 'approved';

  select coalesce(sum(amount), 0) into v_total
  from settlements
  where event_id = p_event_id;

  if v_participant_count > 0 then
    v_share_base := v_total / v_participant_count;
    v_share_remainder := v_total % v_participant_count;
    v_pidx := 0;
    for v_participant in
      select user_id from event_participants
      where event_id = p_event_id and status = 'approved'
      order by applied_at asc
    loop
      insert into settlement_shares (event_id, user_id, amount_owed)
      values (
        p_event_id,
        v_participant.user_id,
        v_share_base + (case when v_pidx < v_share_remainder then 1 else 0 end)
      )
      on conflict (event_id, user_id)
      do update set amount_owed = excluded.amount_owed, updated_at = now();
      v_pidx := v_pidx + 1;
    end loop;
  end if;
end;
$$;

comment on function public.register_settlement_item(uuid, text, integer, uuid[]) is '주최자가 비용 항목을 등록하는 유일한 공식 경로. 결제자 수로 1/N 분할해 settlements에 기록하고, 승인된 참여자 수 기준으로 settlement_shares.amount_owed를 재계산한다(is_paid는 upsert의 conflict 대상에서 제외되어 보존됨).';

revoke all on function public.register_settlement_item(uuid, text, integer, uuid[]) from public, anon;
grant execute on function public.register_settlement_item(uuid, text, integer, uuid[]) to authenticated;
