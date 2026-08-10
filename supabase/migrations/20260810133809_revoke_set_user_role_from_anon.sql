-- Supabase는 public 스키마의 신규 함수에 기본적으로 anon 역할의 EXECUTE 권한을
-- 자동 부여한다(ALTER DEFAULT PRIVILEGES). 이전 마이그레이션의 "revoke all ... from public"은
-- PUBLIC 의사 역할만 회수할 뿐 anon에 개별적으로 부여된 권한은 남기 때문에 명시적으로 회수한다.
-- (is_admin() 내부 체크로 이미 실질적으로 막혀 있었으나, 방어 계층을 하나 더 둔다.)
revoke execute on function public.set_user_role(uuid, text) from anon;
