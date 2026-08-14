"use client";

import { ImageIcon, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  EVENT_DISPLAY_STATUS_VARIANT,
  getEventDisplayStatus,
} from "@/lib/events/status";

export type EventCardData = {
  id: string;
  title: string;
  category: string;
  eventDatetime: string;
  location: string;
  capacity: number;
  participantCount: number;
  /** events 테이블의 status 컬럼 값('open' | 'cancelled') */
  status: string;
  /** 커버 이미지 URL. 데이터 연동 전(Phase UX-3-A)에는 undefined로 전달됨 */
  coverImageUrl?: string;
  /** 주최자 이름. 데이터 연동 전에는 undefined로 전달됨 */
  hostName?: string;
  /** 주최자 아바타 URL. 데이터 연동 전에는 undefined로 전달됨 */
  hostAvatarUrl?: string;
};

export function EventCard({ event }: { event: EventCardData }) {
  const displayStatus = getEventDisplayStatus(
    event.eventDatetime,
    event.status,
  );
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="hover:bg-accent overflow-hidden transition-colors">
        {/* 커버 이미지 영역 - Card 상단 모서리(rounded-xl)에 맞춰 위쪽만 둥글게 처리 */}
        {event.coverImageUrl && !imgFailed ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="h-32 w-full rounded-t-xl object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="bg-muted text-muted-foreground flex h-32 w-full items-center justify-center rounded-t-xl">
            <ImageIcon className="size-6" aria-hidden="true" />
          </div>
        )}

        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>{event.title}</CardTitle>
            <div className="flex shrink-0 items-center gap-1.5">
              <Badge variant="outline">{event.category}</Badge>
              <Badge variant={EVENT_DISPLAY_STATUS_VARIANT[displayStatus]}>
                {displayStatus}
              </Badge>
            </div>
          </div>
          <CardDescription>{event.location}</CardDescription>
        </CardHeader>

        <CardContent className="text-muted-foreground flex flex-col gap-2 text-sm">
          <span>{new Date(event.eventDatetime).toLocaleString("ko-KR")}</span>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Avatar className="h-6 w-6">
                {event.hostAvatarUrl && (
                  <AvatarImage
                    src={event.hostAvatarUrl}
                    alt={event.hostName ?? "주최자"}
                  />
                )}
                <AvatarFallback>
                  {event.hostName ? event.hostName.charAt(0) : "?"}
                </AvatarFallback>
              </Avatar>
              <span>{event.hostName ?? "알 수 없음"}</span>
            </div>

            <div className="flex items-center gap-1">
              <Users className="size-4" aria-hidden="true" />
              <span>
                {event.participantCount}/{event.capacity}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
