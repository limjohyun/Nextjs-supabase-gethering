import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type EventCardData = {
  id: string;
  title: string;
  category: string;
  eventDatetime: string;
  location: string;
  capacity: number;
  participantCount: number;
};

export function EventCard({ event }: { event: EventCardData }) {
  return (
    <Link href={`/events/${event.id}`}>
      <Card className="transition-colors hover:bg-accent">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>{event.title}</CardTitle>
            <Badge variant="outline">{event.category}</Badge>
          </div>
          <CardDescription>{event.location}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {new Date(event.eventDatetime).toLocaleString("ko-KR")} · 정원{" "}
          {event.participantCount}/{event.capacity}
        </CardContent>
      </Card>
    </Link>
  );
}
