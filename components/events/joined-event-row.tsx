"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { cancelParticipation } from "@/app/events/[id]/participants-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ParticipationStatus = "pending" | "approved" | "rejected" | "cancelled";

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

export function JoinedEventRow({
  participationId,
  eventId,
  title,
  status,
}: {
  participationId: string;
  eventId: string;
  title: string;
  status: ParticipationStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelParticipation(eventId, participationId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-center justify-between rounded-md border p-3">
        <Link href={`/events/${eventId}`} className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
        </Link>
        {status !== "cancelled" && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={handleCancel}
          >
            참여 취소
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </li>
  );
}
