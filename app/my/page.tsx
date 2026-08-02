"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ParticipationStatus = "pending" | "approved" | "rejected" | "cancelled";

type MockHostedEvent = {
  id: string;
  title: string;
  category: string;
};

type MockJoinedEvent = {
  id: string;
  title: string;
  category: string;
  status: ParticipationStatus;
};

const STATUS_LABEL: Record<ParticipationStatus, string> = {
  pending: "승인 대기",
  approved: "승인됨",
  rejected: "거절됨",
  cancelled: "취소됨",
};

const STATUS_VARIANT: Record<
  ParticipationStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
  cancelled: "secondary",
};

const mockHostedEvents: MockHostedEvent[] = [
  { id: "1", title: "주말 수영 모임", category: "수영" },
];

const initialJoinedEvents: MockJoinedEvent[] = [
  {
    id: "2",
    title: "평일 저녁 헬스 모임",
    category: "헬스",
    status: "pending",
  },
];

export default function MyEventsPage() {
  const [joinedEvents, setJoinedEvents] = useState(initialJoinedEvents);

  function handleCancel(id: string) {
    setJoinedEvents((prev) =>
      prev.map((event) =>
        event.id === id ? { ...event, status: "cancelled" as const } : event,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">내 모임</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">주최한 모임</h2>
        {mockHostedEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            아직 주최한 모임이 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {mockHostedEvents.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"
                >
                  <span className="text-sm font-medium">{event.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {event.category}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">참여한 모임</h2>
        {joinedEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            아직 참여한 모임이 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {joinedEvents.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <Link
                  href={`/events/${event.id}`}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm font-medium">{event.title}</span>
                  <Badge variant={STATUS_VARIANT[event.status]}>
                    {STATUS_LABEL[event.status]}
                  </Badge>
                </Link>
                {event.status !== "cancelled" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancel(event.id)}
                  >
                    참여 취소
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
