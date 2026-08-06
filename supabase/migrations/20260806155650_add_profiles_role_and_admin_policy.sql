-- 사용자 권한(role) 컬럼 추가: 'user'(일반) | 'admin'(전체 관리자)
alter table public.profiles
  add column role text not null default 'user' check (role in ('user', 'admin'));

comment on column public.profiles.role is '사용자 권한: user(일반) 또는 admin(사이트 전체 관리자)';

-- RLS 재귀 없이 현재 사용자의 관리자 여부를 확인하는 헬퍼 함수
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

comment on function public.is_admin() is '현재 로그인한 사용자가 관리자(role=admin)인지 확인. RLS 정책에서 재귀 없이 사용하기 위해 SECURITY DEFINER로 정의.';

-- 관리자는 사이트 전체 참여 신청 현황을 조회할 수 있다 (기존 정책은 본인/주최자로 제한됨)
create policy "관리자는 모든 참여 신청을 조회할 수 있다"
on public.event_participants
for select
to authenticated
using (public.is_admin());
