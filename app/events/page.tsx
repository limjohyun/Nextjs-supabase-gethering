import Link from "next/link";
import { Suspense } from "react";

import { EventCard, type EventCardData } from "@/components/events/event-card";
import { createClient } from "@/lib/supabase/server";

async function EventsList() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(
      "id, title, category, event_datetime, location, capacity, status, cover_image_url, profiles!events_host_id_fkey(full_name, avatar_url)",
    )
    .neq("status", "cancelled")
    .order("event_datetime", { ascending: true });

  const eventIds = (data ?? []).map((event) => event.id);
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

  const events: EventCardData[] = (data ?? []).map((event) => ({
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

  if (events.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        아직 등록된 모임이 없습니다.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {events.map((event) => (
        <li key={event.id}>
          <EventCard event={event} />
        </li>
      ))}
    </ul>
  );
}

export default function EventsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">모임 목록</h1>
        <Link
          href="/events/new"
          className="text-sm underline underline-offset-4"
        >
          모임 만들기
        </Link>
      </div>
      <Suspense
        fallback={
          <p className="text-muted-foreground text-sm">불러오는 중...</p>
        }
      >
        <EventsList />
      </Suspense>
    </div>
  );
}
