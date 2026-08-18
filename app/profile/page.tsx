import { Calendar, Shield, Users } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";

async function ProfileContent() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) {
    return (
      <p className="text-muted-foreground text-sm">로그인이 필요합니다.</p>
    );
  }

  const [
    { data: profile },
    { count: hostedEventCount },
    { count: joinedEventCount },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url, role")
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
  const isAdmin = profile?.role === "admin";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">프로필</h1>

      {/* 아바타 + 이름 + 이메일 카드 */}
      <Card>
        <CardContent className="flex items-center justify-between gap-4 pt-6">
          <div className="flex items-center gap-4">
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
              <span className="text-muted-foreground text-sm">
                {user.email}
              </span>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/profile/edit">편집</Link>
          </Button>
        </CardContent>
      </Card>

      {/* 통계 카드 2개: 만든 모임 / 참여한 모임 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              만든 모임
            </CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hostedEventCount ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              참여한 모임
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
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
              <dt className="text-muted-foreground w-20">역할</dt>
              <dd>
                <Badge variant={isAdmin ? "default" : "outline"}>
                  {isAdmin ? "관리자" : "사용자"}
                </Badge>
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground w-20">가입일</dt>
              <dd>{joinedAt}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* 관리자 전용 진입 카드 - 데스크톱은 상단 nav에도 링크가 있지만, 하단 탭바에는
          없는 모바일 화면에서 관리자 대시보드로 갈 수 있는 통로를 남겨둔다 */}
      {isAdmin && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 pt-6">
            <div className="flex items-center gap-3">
              <Shield className="text-muted-foreground h-5 w-5" />
              <div className="flex flex-col">
                <span className="font-medium">관리자 대시보드</span>
                <span className="text-muted-foreground text-sm">
                  전체 이벤트·가입자·통계 관리
                </span>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">이동</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <LogoutButton />
        <DeleteAccountButton />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={<p className="text-muted-foreground text-sm">불러오는 중...</p>}
    >
      <ProfileContent />
    </Suspense>
  );
}
