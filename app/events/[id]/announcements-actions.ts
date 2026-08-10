"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { announcementFormSchema } from "@/lib/validations/announcement";

type ActionResult = { error: string } | undefined;

/** 주최자가 공지를 작성한다. */
export async function createAnnouncement(
  eventId: string,
  content: string,
): Promise<ActionResult> {
  const parsed = announcementFormSchema.safeParse({ content });
  if (!parsed.success) {
    return { error: "공지 내용을 입력해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").insert({
    event_id: eventId,
    content: parsed.data.content,
  });

  if (error) {
    return { error: "공지 등록에 실패했습니다." };
  }

  revalidatePath(`/events/${eventId}`);
}
