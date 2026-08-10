"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { createAnnouncement } from "@/app/events/[id]/announcements-actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  announcementFormSchema,
  type AnnouncementFormValues,
} from "@/lib/validations/announcement";

export type AnnouncementData = {
  id: string;
  content: string;
  createdAt: string;
};

export function EventAnnouncementsTab({
  eventId,
  isHost,
  announcements,
}: {
  eventId: string;
  isHost: boolean;
  announcements: AnnouncementData[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: { content: "" },
  });

  function onSubmit(values: AnnouncementFormValues) {
    setError(null);
    startTransition(async () => {
      const result = await createAnnouncement(eventId, values.content);
      if (result?.error) {
        setError(result.error);
        return;
      }
      form.reset();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {isHost && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-3"
          >
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>공지 작성</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="참여자에게 전달할 공지 내용을 입력해주세요."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" disabled={isPending} className="self-start">
              {isPending ? "처리 중..." : "공지 등록"}
            </Button>
          </form>
        </Form>
      )}

      <div className="flex flex-col gap-3">
        <h3 className="text-muted-foreground text-sm font-semibold">
          공지 목록
        </h3>
        {announcements.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            아직 등록된 공지가 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {announcements.map((announcement) => (
              <li key={announcement.id} className="rounded-md border p-3">
                <p className="text-sm whitespace-pre-wrap">
                  {announcement.content}
                </p>
                <p className="text-muted-foreground mt-2 text-xs">
                  {new Date(announcement.createdAt).toLocaleString("ko-KR")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
