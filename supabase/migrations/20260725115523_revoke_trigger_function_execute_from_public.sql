-- PostgreSQL은 함수 생성 시 기본적으로 PUBLIC(모든 역할)에 EXECUTE 권한을 부여한다.
-- 이전 마이그레이션에서 anon/authenticated는 개별적으로 회수했지만 PUBLIC 의사 역할에는
-- 여전히 권한이 남아있어 별도로 회수한다.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_updated_at() from public;
