alter table public.events
  add column cover_image_url text null;

comment on column public.events.cover_image_url is '모임 카드에 표시할 커버 이미지 URL(외부 링크, 업로드 기능 없음)';
