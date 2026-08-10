-- 이전 마이그레이션(add_set_user_role_function)의 컬럼 단위 REVOKE UPDATE/INSERT(role)이
-- 예상대로 동작하지 않음을 발견해 수정한다. PostgreSQL은 테이블 단위 GRANT가 이미 존재하는
-- 상태에서 컬럼 단위 REVOKE만 실행하면 해당 컬럼의 attacl이 NULL로 남아 테이블 단위 권한으로
-- 폴백되어 실제로는 차단되지 않는다. 테이블 단위 권한을 먼저 회수한 뒤 role을 제외한 컬럼만
-- 다시 명시적으로 부여해야 한다.
revoke update, insert on public.profiles from authenticated, anon;

grant insert (id, username, full_name, avatar_url, website, bio, created_at, updated_at)
  on public.profiles to authenticated, anon;
grant update (username, full_name, avatar_url, website, bio, updated_at)
  on public.profiles to authenticated, anon;
