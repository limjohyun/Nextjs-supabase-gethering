-- 프로필 아바타 업로드용 공개 버킷.
-- 업로드 경로 컨벤션: `{auth.uid()}/{filename}` — 로그인한 사용자는 자신의 uid를
-- 최상위 폴더로 하는 경로에만 업로드할 수 있도록 INSERT 정책에서 강제한다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
);

-- 공개 버킷이므로 공개 URL을 통한 다운로드는 정책 없이도 허용되지만, 이 프로젝트의
-- "민감한 접근은 항상 명시적 RLS 정책으로 문서화한다" 컨벤션에 맞춰 명시적으로 선언한다.
create policy "누구나 avatars 이미지를 조회할 수 있다"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

-- 인증된 사용자는 자신의 uid로 시작하는 경로에만 업로드할 수 있다(다른 사용자
-- 폴더에 덮어쓰기/오염시키는 것을 방지).
create policy "인증된 사용자는 본인 폴더에만 아바타 이미지를 업로드할 수 있다"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

comment on policy "인증된 사용자는 본인 폴더에만 아바타 이미지를 업로드할 수 있다"
  on storage.objects is 'avatars 버킷에 대한 유일한 쓰기 경로. 파일 경로의
  최상위 폴더가 업로더 본인의 auth.uid()와 일치해야만 업로드를 허용한다.
  UPDATE/DELETE 정책은 의도적으로 두지 않았다(MVP 범위 외 — 기존 아바타 이미지
  교체 시 이전 파일 정리는 하지 않는다).';
