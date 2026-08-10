-- profiles.role은 일반 사용자가 직접 수정할 수 없도록 컬럼 단위로 권한을 회수한다.
-- 기존 "사용자는 본인 프로필을 수정/추가할 수 있다" RLS 정책은 role 컬럼을 별도로
-- 막지 않아 누구나 자신의 role을 'admin'으로 직접 바꿀 수 있는 권한 상승 취약점이 있었다.
revoke update (role) on public.profiles from authenticated, anon;
revoke insert (role) on public.profiles from authenticated, anon;

-- 관리자가 다른 사용자의 role을 변경하는 유일한 공식 경로.
-- SECURITY DEFINER로 실행되어 위 REVOKE와 무관하게 role을 갱신할 수 있으며,
-- 호출자가 관리자가 아니면 예외를 던져 거부한다.
create or replace function public.set_user_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception '관리자만 사용자 권한을 변경할 수 있습니다.';
  end if;

  if new_role not in ('user', 'admin') then
    raise exception '허용되지 않은 role 값입니다: %', new_role;
  end if;

  update public.profiles
  set role = new_role
  where id = target_user_id;
end;
$$;

comment on function public.set_user_role(uuid, text) is '관리자가 대상 사용자의 role(user/admin)을 변경하는 유일한 공식 경로. 호출자가 관리자가 아니면 예외를 던진다.';

revoke all on function public.set_user_role(uuid, text) from public;
grant execute on function public.set_user_role(uuid, text) to authenticated;
