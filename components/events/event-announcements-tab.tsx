"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

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

// createdAt 내림차순(최신순)으로 미리 정렬해둔다 — B단계에서 order("created_at", { ascending: false })로 그대로 교체 가능.
const initialAnnouncements: AnnouncementData[] = [
  {
    id: "a3",
    content: "이번 주 모임은 우천으로 실내 수영장으로 변경되었습니다.",
    createdAt: "2026-08-09T10:00:00+09:00",
  },
  {
    id: "a2",
    content: "준비물: 수영모, 수경, 개인 물통을 꼭 챙겨주세요.",
    createdAt: "2026-08-05T14:30:00+09:00",
  },
  {
    id: "a1",
    content:
      "모임에 오신 걸 환영합니다! 첫 모임은 간단한 자기소개로 시작할게요.",
    createdAt: "2026-08-01T09:00:00+09:00",
  },
];

export function EventAnnouncementsTab({ isHost }: { isHost: boolean }) {
  const [announcements, setAnnouncements] =
    useState<AnnouncementData[]>(initialAnnouncements);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: { content: "" },
  });

  function onSubmit(values: AnnouncementFormValues) {
    setIsSubmitting(true);
    setAnnouncements((prev) => [
      {
        id: crypto.randomUUID(),
        content: values.content,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    form.reset();
    setIsSubmitting(false);
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
            <Button
              type="submit"
              disabled={isSubmitting}
              className="self-start"
            >
              {isSubmitting ? "처리 중..." : "공지 등록"}
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
