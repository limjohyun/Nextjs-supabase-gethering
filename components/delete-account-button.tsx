"use client";

import { useState, useTransition } from "react";

import { deleteAccount } from "@/app/profile/actions";
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

export function DeleteAccountButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount();
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">회원 탈퇴</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>정말로 회원 탈퇴하시겠어요?</DialogTitle>
          <DialogDescription>
            본인이 만든 모임과 참여 내역이 모두 함께 삭제되며, 이 작업은 되돌릴
            수 없습니다.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">닫기</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "처리 중..." : "탈퇴 확정"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
