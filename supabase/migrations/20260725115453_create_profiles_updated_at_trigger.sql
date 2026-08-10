-- profiles 행이 수정될 때 updated_at을 자동으로 now()로 갱신한다.
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profiles_updated
before update on public.profiles
for each row execute function public.handle_updated_at();
