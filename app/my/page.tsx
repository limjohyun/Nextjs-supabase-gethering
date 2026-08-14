import { Suspense } from "react";

import { EventCard, type EventCardData } from "@/components/events/event-card";
import { JoinedEventRow } from "@/components/events/joined-event-row";
import { createClient } from "@/lib/supabase/server";

async function MyEventsContent() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getClaims();
  const userId = userData?.claims?.sub as string | undefined;

  if (!userId) {
    return (
      <p className="text-muted-foreground text-sm">로그인이 필요합니다.</p>
    );
  }

  const [{ data: hostedEvents }, { data: joinedParticipations }] =
    await Promise.all([
      supabase
        .from("events")
        .select(
          "id, title, category, event_datetime, location, capacity, status, cover_image_url, profiles!events_host_id_fkey(full_name, avatar_url)",
        )
        .eq("host_id", userId)
        .neq("status", "cancelled")
        .order("event_datetime", { ascending: true }),
      supabase
        .from("event_participants")
        .select(
          "id, status, events!event_participants_event_id_fkey(id, title, cover_image_url, status)",
        )
        .eq("user_id", userId)
        .order("applied_at", { ascending: true }),
    ]);

  const hostedEventIds = (hostedEvents ?? []).map((event) => event.id);
  const { data: approvedParticipants } =
    hostedEventIds.length > 0
      ? await supabase
          .from("event_participants")
          .select("event_id")
          .in("event_id", hostedEventIds)
          .eq("status", "approved")
      : { data: [] };

  const participantCountByEvent = new Map<string, number>();
  for (const participant of approvedParticipants ?? []) {
    participantCountByEvent.set(
      participant.event_id,
      (participantCountByEvent.get(participant.event_id) ?? 0) + 1,
    );
  }

  const hostedEventCards: EventCardData[] = (hostedEvents ?? []).map(
    (event) => ({
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
    }),
  );

  const joinedEvents = (joinedParticipations ?? [])
    .filter((p) => p.events !== null && p.events.status !== "cancelled")
    .map((p) => ({
      participationId: p.id,
      status: p.status as "pending" | "approved" | "rejected" | "cancelled",
      eventId: p.events!.id,
      title: p.events!.title,
      coverImageUrl: p.events!.cover_image_url ?? undefined,
    }));

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">내 모임</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">주최한 모임</h2>
        {hostedEventCards.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            아직 주최한 모임이 없습니다.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {hostedEventCards.map((event) => (
              <li key={event.id}>
                <EventCard event={event} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">참여한 모임</h2>
        {joinedEvents.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            아직 참여한 모임이 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {joinedEvents.map((event) => (
              <JoinedEventRow key={event.participationId} {...event} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function MyEventsPage() {
  return (
    <Suspense
      fallback={<p className="text-muted-foreground text-sm">불러오는 중...</p>}
    >
      <MyEventsContent />
    </Suspense>
  );
}
