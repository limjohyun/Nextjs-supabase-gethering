create policy "인증된 사용자는 승인된 참여자를 조회할 수 있다"
on public.event_participants
for select
to authenticated
using (status = 'approved');
