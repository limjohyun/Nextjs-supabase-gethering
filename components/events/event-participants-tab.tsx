"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  applyToEvent,
  approveParticipant,
  cancelParticipation,
  rejectParticipant,
} from "@/app/events/[id]/participants-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ParticipantStatus = "pending" | "approved" | "rejected" | "cancelled";

export type ParticipantData = {
  id: string;
  status: ParticipantStatus;
  name: string;
};

export type MyParticipationData = {
  id: string;
  status: ParticipantStatus;
};

/** 승인된 참여자 조회용 데이터. userId는 향후 프로필 페이지 연결을 위해 포함한다 */
export type ApprovedParticipantData = {
  userId: string;
  name: string;
  avatarUrl: string | null;
};

const STATUS_LABEL: Record<ParticipantStatus, string> = {
  pending: "승인 대기",
  approved: "승인됨",
  rejected: "거절됨",
  cancelled: "취소됨",
};

const STATUS_VARIANT: Record<
  ParticipantStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
  cancelled: "secondary",
};

export function EventParticipantsTab({
  eventId,
  isHost,
  participants,
  myParticipation,
  approvedParticipants,
}: {
  eventId: string;
  isHost: boolean;
  participants: ParticipantData[];
  myParticipation: MyParticipationData | null;
  approvedParticipants: ApprovedParticipantData[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleApply() {
    setError(null);
    startTransition(async () => {
      const result = await applyToEvent(eventId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleCancel(participantId: string) {
    setError(null);
    startTransition(async () => {
      const result = await cancelParticipation(eventId, participantId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleApprove(participantId: string) {
    setError(null);
    startTransition(async () => {
      const result = await approveParticipant(eventId, participantId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleReject(participantId: string) {
    setError(null);
    startTransition(async () => {
      const result = await rejectParticipant(eventId, participantId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex flex-col gap-3">
        <h3 className="text-muted-foreground text-sm font-semibold">
          참여자 ({approvedParticipants.length}명)
        </h3>
        {approvedParticipants.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            아직 승인된 참여자가 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {approvedParticipants.map((participant) => (
              <li
                key={participant.userId}
                className="flex items-center gap-2 rounded-md border p-3"
              >
                <Avatar className="h-6 w-6">
                  {participant.avatarUrl && (
                    <AvatarImage
                      src={participant.avatarUrl}
                      alt={participant.name}
                    />
                  )}
                  <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{participant.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isHost && (
        <div className="flex items-center gap-3">
          <Button
            onClick={handleApply}
            disabled={isPending || myParticipation !== null}
          >
            {myParticipation ? "신청 완료" : "참여 신청"}
          </Button>
          {myParticipation && (
            <>
              <Badge variant={STATUS_VARIANT[myParticipation.status]}>
                {STATUS_LABEL[myParticipation.status]}
              </Badge>
              {myParticipation.status !== "cancelled" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleCancel(myParticipation.id)}
                >
                  참여 취소
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {isHost && (
        <div className="flex flex-col gap-3">
          <h3 className="text-muted-foreground text-sm font-semibold">
            참여 신청 관리
          </h3>
          {participants.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              아직 신청한 참여자가 없습니다.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {participants.map((participant) => (
                <li
                  key={participant.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {participant.name}
                    </span>
                    <Badge variant={STATUS_VARIANT[participant.status]}>
                      {STATUS_LABEL[participant.status]}
                    </Badge>
                  </div>
                  {participant.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleApprove(participant.id)}
                      >
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isPending}
                        onClick={() => handleReject(participant.id)}
                      >
                        거절
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
