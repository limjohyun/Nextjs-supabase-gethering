-- 모임 상세/참여자 목록 등에서 다른 사용자의 프로필(full_name/avatar_url 등)을 표시하려면
-- 인증된 사용자가 서로의 프로필을 조회할 수 있어야 한다.
-- 기존 정책("사용자는 본인 프로필을 조회할 수 있다")은 본인 행만 허용하므로,
-- 다른 사용자가 주최자/참여자 프로필을 조인 조회하면 RLS에 막혀 결과가 비어 있었다.
create policy "인증된 사용자는 모든 프로필을 조회할 수 있다"
  on public.profiles for select
  to authenticated
  using (true);
