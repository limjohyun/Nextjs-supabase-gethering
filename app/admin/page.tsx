import { Calendar, Megaphone, Users } from "lucide-react";
import { Suspense } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminUserRoleToggle } from "@/components/admin-user-role-toggle";
import { EventCard, type EventCardData } from "@/components/events/event-card";
import {
  EVENT_DISPLAY_STATUS_VARIANT,
  getEventDisplayStatus,
  type EventDisplayStatus,
} from "@/lib/events/status";
import { createClient } from "@/lib/supabase/server";

async function AdminDashboardContent() {
  const supabase = await createClient();

  const [{ data: events }, { data: profiles }, { data: userData }] =
    await Promise.all([
      supabase
        .from("events")
        .select(
          "id, title, category, event_datetime, location, capacity, status, cover_image_url, profiles!events_host_id_fkey(full_name, avatar_url)",
        )
        .order("event_datetime", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, role, created_at")
        .order("created_at", { ascending: false }),
      supabase.auth.getClaims(),
    ]);

  const currentUserId = userData?.claims?.sub as string | undefined;

  const eventIds = (events ?? []).map((event) => event.id);
  const { data: approvedParticipants } =
    eventIds.length > 0
      ? await supabase
          .from("event_participants")
          .select("event_id")
          .in("event_id", eventIds)
          .eq("status", "approved")
      : { data: [] };

  const participantCountByEvent = new Map<string, number>();
  for (const participant of approvedParticipants ?? []) {
    participantCountByEvent.set(
      participant.event_id,
      (participantCountByEvent.get(participant.event_id) ?? 0) + 1,
    );
  }

  const eventCards: EventCardData[] = (events ?? []).map((event) => ({
    id: event.id,
    title: event.title,
    category: event.category,
    eventDatetime: event.event_datetime,
    location: event.location,
    capacity: event.capacity,
    status: event.status,
    coverImageUrl: event.cover_image_url ?? undefined,
    hostName: event.profiles?.full_name ?? undefined,
    hostAvatarUrl: event.profiles?.avatar_url ?? undefined,
    participantCount: participantCountByEvent.get(event.id) ?? 0,
  }));

  const statusCounts: Record<EventDisplayStatus, number> = {
    예정: 0,
    종료: 0,
    취소됨: 0,
  };
  for (const event of eventCards) {
    const displayStatus = getEventDisplayStatus(
      event.eventDatetime,
      event.status,
    );
    statusCounts[displayStatus] += 1;
  }

  const totalApprovedParticipants = approvedParticipants?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">관리자 대시보드</h1>

      <Tabs defaultValue="events">
        {/* 모바일에서 탭 터치 타겟이 WCAG 최소 권장 크기(44px)에 가깝도록 h-11, lg 이상은 기존 h-9 유지 */}
        <TabsList className="!h-11 lg:!h-9">
          <TabsTrigger value="events">전체 이벤트</TabsTrigger>
          <TabsTrigger value="users">전체 가입자</TabsTrigger>
          <TabsTrigger value="stats">통계</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="flex flex-col gap-3 pt-2">
          {eventCards.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              등록된 모임이 없습니다.
            </p>
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {eventCards.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="users" className="pt-2">
          {profiles && profiles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자</TableHead>
                  <TableHead>권한</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {profile.avatar_url && (
                            <AvatarImage
                              src={profile.avatar_url}
                              alt={profile.full_name ?? "사용자"}
                            />
                          )}
                          <AvatarFallback>
                            {(
                              profile.full_name ??
                              profile.username ??
                              "?"
                            ).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {profile.full_name ?? profile.username ?? "이름 없음"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          profile.role === "admin" ? "default" : "outline"
                        }
                      >
                        {profile.role === "admin" ? "관리자" : "사용자"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(profile.created_at).toLocaleDateString("ko-KR")}
                    </TableCell>
                    <TableCell>
                      <AdminUserRoleToggle
                        userId={profile.id}
                        role={profile.role}
                        isSelf={profile.id === currentUserId}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">
              가입한 사용자가 없습니다.
            </p>
          )}
        </TabsContent>

        <TabsContent value="stats" className="pt-2">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  전체 이벤트
                </CardTitle>
                <Calendar className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{eventCards.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  전체 가입자
                </CardTitle>
                <Users className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {profiles?.length ?? 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  승인된 참여 신청
                </CardTitle>
                <Megaphone className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalApprovedParticipants}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">이벤트 상태 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-3 gap-4 text-center">
                {(Object.keys(statusCounts) as EventDisplayStatus[]).map(
                  (status) => (
                    <div key={status} className="flex flex-col gap-1">
                      <dt>
                        <Badge variant={EVENT_DISPLAY_STATUS_VARIANT[status]}>
                          {status}
                        </Badge>
                      </dt>
                      <dd className="text-xl font-bold">
                        {statusCounts[status]}
                      </dd>
                    </div>
                  ),
                )}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={<p className="text-muted-foreground text-sm">불러오는 중...</p>}
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
