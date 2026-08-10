"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setUserRole } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function AdminUserRoleToggle({
  userId,
  role,
  isSelf,
}: {
  userId: string;
  role: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (isSelf) {
    return <span className="text-muted-foreground text-xs">본인 계정</span>;
  }

  function handleToggle() {
    setError(null);
    const nextRole = role === "admin" ? "user" : "admin";
    startTransition(async () => {
      const result = await setUserRole(userId, nextRole);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={handleToggle}
      >
        {isPending
          ? "처리 중..."
          : role === "admin"
            ? "관리자 해제"
            : "관리자로 지정"}
      </Button>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
