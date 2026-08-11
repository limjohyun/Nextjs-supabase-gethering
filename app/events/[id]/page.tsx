import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  EventAnnouncementsTab,
  type AnnouncementData,
} from "@/components/events/event-announcements-tab";
import {
  EventCarpoolTab,
  type CarpoolData,
  type CarpoolRequestData,
} from "@/components/events/event-carpool-tab";
import { EventInfoTab } from "@/components/events/event-info-tab";
import {
  EventParticipantsTab,
  type MyParticipationData,
  type ParticipantData,
} from "@/components/events/event-participants-tab";
import { EventSettlementTab } from "@/components/events/event-settlement-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";

async function EventDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: event, error },
    { data: userData },
    { data: announcementsData },
    { data: carpoolsData },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("*, profiles!events_host_id_fkey(full_name)")
      .eq("id", id)
      .single(),
    supabase.auth.getClaims(),
    supabase
      .from("announcements")
      .select("id, content, created_at")
      .eq("event_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("carpools")
      .select(
        "id, driver_id, departure_location, departure_time, seat_count, profiles!carpools_driver_id_fkey(full_name), carpool_requests(id, status, applied_at, profiles!carpool_requests_user_id_fkey(full_name))",
      )
      .eq("event_id", id)
      .order("created_at", { ascending: true })
      .order("applied_at", {
        referencedTable: "carpool_requests",
        ascending: true,
      }),
  ]);

  if (error || !event) {
    notFound();
  }

  const currentUserId = userData?.claims?.sub as string | undefined;
  const isHost = currentUserId === event.host_id;
  const hostName = event.profiles?.full_name ?? "알 수 없음";

  const announcements: AnnouncementData[] = (announcementsData ?? []).map(
    (announcement) => ({
      id: announcement.id,
      content: announcement.content,
      createdAt: announcement.created_at,
    }),
  );

  const carpools: CarpoolData[] = (carpoolsData ?? []).map((carpool) => ({
    id: carpool.id,
    driverId: carpool.driver_id,
    driverName: carpool.profiles?.full_name ?? "알 수 없음",
    departureLocation: carpool.departure_location,
    departureTime: carpool.departure_time,
    seatCount: carpool.seat_count,
    requests: (carpool.carpool_requests ?? []).map((request) => ({
      id: request.id,
      requesterName: request.profiles?.full_name ?? "알 수 없음",
      status: request.status as CarpoolRequestData["status"],
    })),
  }));

  let participants: ParticipantData[] = [];
  let myParticipation: MyParticipationData | null = null;

  if (isHost) {
    const { data } = await supabase
      .from("event_participants")
      .select("id, status, profiles!event_participants_user_id_fkey(full_name)")
      .eq("event_id", id)
      .order("applied_at", { ascending: true });
    participants = (data ?? []).map((p) => ({
      id: p.id,
      status: p.status as ParticipantData["status"],
      name: p.profiles?.full_name ?? "알 수 없음",
    }));
  } else if (currentUserId) {
    const { data } = await supabase
      .from("event_participants")
      .select("id, status")
      .eq("event_id", id)
      .eq("user_id", currentUserId)
      .maybeSingle();
    myParticipation = data
      ? { id: data.id, status: data.status as MyParticipationData["status"] }
      : null;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{event.title}</h1>
      <Tabs defaultValue="info">
        {/* 모바일에서 탭 터치 타겟이 WCAG 최소 권장 크기(44px)에 가깝도록 h-11, sm 이상은 기존 h-9 유지 */}
        <TabsList className="!h-11 sm:!h-9">
          <TabsTrigger value="info">기본정보</TabsTrigger>
          <TabsTrigger value="announcements">공지</TabsTrigger>
          <TabsTrigger value="participants">참여자</TabsTrigger>
          <TabsTrigger value="carpool">카풀</TabsTrigger>
          <TabsTrigger value="settlement">정산</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <EventInfoTab
            eventId={event.id}
            title={event.title}
            category={event.category}
            location={event.location}
            eventDatetime={event.event_datetime}
            capacity={event.capacity}
            status={event.status}
            hostName={hostName}
            isHost={isHost}
          />
        </TabsContent>
        <TabsContent value="announcements">
          <EventAnnouncementsTab
            eventId={event.id}
            isHost={isHost}
            announcements={announcements}
          />
        </TabsContent>
        <TabsContent value="participants">
          <EventParticipantsTab
            eventId={event.id}
            isHost={isHost}
            participants={participants}
            myParticipation={myParticipation}
          />
        </TabsContent>
        <TabsContent value="carpool">
          <EventCarpoolTab
            eventId={event.id}
            currentUserId={currentUserId}
            carpools={carpools}
          />
        </TabsContent>
        <TabsContent value="settlement">
          <EventSettlementTab isHost={isHost} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={<p className="text-muted-foreground text-sm">불러오는 중...</p>}
    >
      <EventDetailContent params={params} />
    </Suspense>
  );
}
