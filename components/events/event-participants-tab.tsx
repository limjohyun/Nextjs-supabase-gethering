"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ParticipantStatus = "pending" | "approved" | "rejected" | "cancelled";

type MockParticipant = {
  id: string;
  name: string;
  status: ParticipantStatus;
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

const initialParticipants: MockParticipant[] = [
  { id: "p1", name: "김참여", status: "approved" },
  { id: "p2", name: "이신청", status: "pending" },
];

export function EventParticipantsTab({ isHost }: { isHost: boolean }) {
  const [participants, setParticipants] =
    useState<MockParticipant[]>(initialParticipants);
  // 참여자 시점 mock 상태 - event_participants 테이블이 없는 Phase 2-A에서는
  // 로컬 state로만 참여 신청/취소 흐름을 흉내낸다(Phase 2-B에서 실 데이터로 교체).
  const [myStatus, setMyStatus] = useState<ParticipantStatus | null>(null);

  function handleApprove(id: string) {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "approved" } : p)),
    );
  }

  function handleReject(id: string) {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "rejected" } : p)),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {!isHost && (
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setMyStatus("pending")}
            disabled={myStatus !== null}
          >
            {myStatus ? "신청 완료" : "참여 신청"}
          </Button>
          {myStatus && (
            <>
              <Badge variant={STATUS_VARIANT[myStatus]}>
                {STATUS_LABEL[myStatus]}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMyStatus(null)}
              >
                참여 취소
              </Button>
            </>
          )}
        </div>
      )}

      {isHost && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            참여자 목록
          </h3>
          {participants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
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
                        onClick={() => handleApprove(participant.id)}
                      >
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
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
