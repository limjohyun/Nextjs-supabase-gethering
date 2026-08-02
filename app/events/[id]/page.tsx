import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EventInfoTab } from "@/components/events/event-info-tab";
import { EventParticipantsTab } from "@/components/events/event-participants-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";

async function EventDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: event, error }, { data: userData }] = await Promise.all([
    supabase
      .from("events")
      .select("*, profiles!events_host_id_fkey(full_name)")
      .eq("id", id)
      .single(),
    supabase.auth.getClaims(),
  ]);

  if (error || !event) {
    notFound();
  }

  const currentUserId = userData?.claims?.sub as string | undefined;
  const isHost = currentUserId === event.host_id;
  const hostName = event.profiles?.full_name ?? "알 수 없음";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{event.title}</h1>
      <Tabs defaultValue="info">
        <TabsList>
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
          <p className="text-sm text-muted-foreground">공지 준비 중</p>
        </TabsContent>
        <TabsContent value="participants">
          <EventParticipantsTab isHost={isHost} />
        </TabsContent>
        <TabsContent value="carpool">
          <p className="text-sm text-muted-foreground">카풀 준비 중</p>
        </TabsContent>
        <TabsContent value="settlement">
          <p className="text-sm text-muted-foreground">정산 준비 중</p>
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
      fallback={<p className="text-sm text-muted-foreground">불러오는 중...</p>}
    >
      <EventDetailContent params={params} />
    </Suspense>
  );
}
