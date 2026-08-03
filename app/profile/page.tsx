import { Calendar, Users } from "lucide-react";
import { Suspense } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

async function ProfileContent() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">로그인이 필요합니다.</p>
    );
  }

  const [
    { data: profile },
    { count: hostedEventCount },
    { count: joinedEventCount },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("host_id", user.id),
    supabase
      .from("event_participants")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const name = profile?.full_name ?? user.email ?? "알 수 없음";
  const joinedAt = new Date(user.created_at).toLocaleDateString("ko-KR");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">프로필</h1>

      {/* 아바타 + 이름 + 이메일 카드 */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <Avatar className="h-16 w-16">
            {profile?.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={name} />
            )}
            <AvatarFallback className="text-lg">
              {name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-lg font-bold">{name}</span>
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 2개: 만든 모임 / 참여한 모임 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              만든 모임
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hostedEventCount ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              참여한 모임
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{joinedEventCount ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* 계정 정보 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>계정 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <dt className="w-20 text-muted-foreground">역할</dt>
              <dd>
                <Badge variant="outline">사용자</Badge>
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="w-20 text-muted-foreground">가입일</dt>
              <dd>{joinedAt}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">불러오는 중...</p>}
    >
      <ProfileContent />
    </Suspense>
  );
}
