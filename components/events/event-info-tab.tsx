"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore, useTransition } from "react";

import { cancelEvent } from "@/app/events/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getEventDisplayStatus } from "@/lib/events/status";

export function EventInfoTab({
  eventId,
  title,
  category,
  location,
  eventDatetime,
  capacity,
  status,
  hostName,
  isHost,
}: {
  eventId: string;
  title: string;
  category: string;
  location: string;
  eventDatetime: string;
  capacity: number;
  status: string;
  hostName: string;
  isHost: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // 서버(Node)와 브라우저의 Intl 로케일 데이터가 달라 "오후"/"PM" 표기가 어긋나
  // hydration mismatch가 나는 문제를 피하기 위해, 날짜 문자열은 클라이언트에서만
  // 계산한다(getServerSnapshot은 null을 반환해 SSR 시점엔 렌더링하지 않음).
  const formattedDatetime = useSyncExternalStore(
    () => () => {},
    () => new Date(eventDatetime).toLocaleString("ko-KR"),
    () => null,
  );

  function handleCancel() {
    startTransition(async () => {
      await cancelEvent(eventId);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid gap-2 text-sm">
        <div className="flex gap-2">
          <dt className="text-muted-foreground w-20">제목</dt>
          <dd>{title}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground w-20">주최자</dt>
          <dd>{hostName}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground w-20">카테고리</dt>
          <dd>{category}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground w-20">장소</dt>
          <dd>{location}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground w-20">일시</dt>
          <dd>{formattedDatetime ?? " "}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground w-20">정원</dt>
          <dd>{capacity}명</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground w-20">상태</dt>
          <dd>{getEventDisplayStatus(eventDatetime, status)}</dd>
        </div>
      </dl>

      {isHost && status !== "cancelled" && (
        <div className="flex gap-2 border-t pt-4">
          <Button asChild variant="outline">
            <Link href={`/events/${eventId}/edit`}>수정</Link>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">모임 취소</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>모임을 취소하시겠어요?</DialogTitle>
                <DialogDescription>
                  취소하면 참여자에게 모임이 취소 상태로 표시됩니다. 이 작업은
                  되돌릴 수 없습니다.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">닫기</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={isPending}
                >
                  {isPending ? "처리 중..." : "취소 확정"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
