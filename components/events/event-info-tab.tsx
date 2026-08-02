"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

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
          <dt className="w-20 text-muted-foreground">제목</dt>
          <dd>{title}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 text-muted-foreground">주최자</dt>
          <dd>{hostName}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 text-muted-foreground">카테고리</dt>
          <dd>{category}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 text-muted-foreground">장소</dt>
          <dd>{location}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 text-muted-foreground">일시</dt>
          <dd>{new Date(eventDatetime).toLocaleString("ko-KR")}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 text-muted-foreground">정원</dt>
          <dd>{capacity}명</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 text-muted-foreground">상태</dt>
          <dd>{status === "cancelled" ? "취소됨" : "모집 중"}</dd>
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
