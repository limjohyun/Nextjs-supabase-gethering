-- =============================================================================
-- 최초 관리자(admin) 부트스트랩 스크립트
-- =============================================================================
-- 용도: 새 환경(신규 Supabase 프로젝트 등)에서 최초의 admin 계정을 지정하기
--       위한 1회성 수동 스크립트입니다. 마이그레이션이 아니므로
--       supabase/migrations/ 에 두지 않고, 자동으로 재생되지 않습니다.
--
-- 왜 필요한가: set_user_role(target_user_id, new_role) RPC는 호출자가 이미
--       admin이어야만 동작합니다(is_admin() 체크). admin이 한 명도 없는
--       새 환경에서는 이 RPC로 첫 admin을 만들 수 없는 "닭과 달걀" 문제가
--       있습니다. handle_new_user() 트리거도 role을 설정하지 않으므로
--       신규 가입자는 항상 role='user'로 시작합니다.
--
-- 실행 방법: 아래 UPDATE 문은 Supabase 대시보드 SQL Editor 또는
--       mcp__supabase__execute_sql로, service_role(postgres) 권한으로
--       실행해야 합니다. profiles.role은 authenticated/anon으로부터
--       UPDATE/INSERT 권한이 회수되어 있지만(권한 상승 방지 목적),
--       service_role은 이 제한을 우회합니다(의도된 동작).
--
-- 사용법: 아래 'YOUR_EMAIL@example.com'을 관리자로 지정할 계정의 이메일로
--       바꾼 뒤 실행하세요.
-- =============================================================================

update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'YOUR_EMAIL@example.com');

-- 반영 확인용. 1행이 반환되고 role='admin'이면 성공. 0행이면 이메일 오타이거나
-- 해당 계정이 아직 최초 로그인 전(profiles row 미생성)입니다.
select p.id, u.email, p.role
from public.profiles p
join auth.users u on u.id = p.id
where u.email = 'YOUR_EMAIL@example.com';
