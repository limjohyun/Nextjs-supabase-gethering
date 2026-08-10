-- 트리거 전용 함수는 클라이언트가 RPC로 직접 호출할 이유가 없으므로
-- anon/authenticated의 EXECUTE 권한을 회수한다.
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.handle_updated_at() from anon, authenticated;
