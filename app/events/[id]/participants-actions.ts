"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type ActionResult = { error: string } | undefined;

/** 로그인한 사용자가 모임에 참여 신청한다. */
export async function applyToEvent(eventId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getClaims();
  const userId = userData?.claims?.sub as string | undefined;
  if (!userId) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase.from("event_participants").insert({
    event_id: eventId,
    user_id: userId,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "이미 참여 신청한 모임입니다." };
    }
    return { error: "참여 신청에 실패했습니다." };
  }

  revalidatePath(`/events/${eventId}`);
}

/** 주최자가 참여 신청을 승인한다. */
export async function approveParticipant(
  eventId: string,
  participantId: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("event_participants")
    .select("status")
    .eq("id", participantId)
    .single();

  if (current?.status !== "pending") {
    return { error: "이미 처리된 신청입니다." };
  }

  const { error } = await supabase
    .from("event_participants")
    .update({ status: "approved" })
    .eq("id", participantId);

  if (error) {
    return { error: "승인에 실패했습니다." };
  }

  revalidatePath(`/events/${eventId}`);
}

/** 주최자가 참여 신청을 거절한다. */
export async function rejectParticipant(
  eventId: string,
  participantId: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("event_participants")
    .select("status")
    .eq("id", participantId)
    .single();

  if (current?.status !== "pending") {
    return { error: "이미 처리된 신청입니다." };
  }

  const { error } = await supabase
    .from("event_participants")
    .update({ status: "rejected" })
    .eq("id", participantId);

  if (error) {
    return { error: "거절에 실패했습니다." };
  }

  revalidatePath(`/events/${eventId}`);
}

/** 참여자가 자신의 참여 신청을 취소한다. */
export async function cancelParticipation(
  eventId: string,
  participantId: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("event_participants")
    .update({ status: "cancelled" })
    .eq("id", participantId);

  if (error) {
    return { error: "참여 취소에 실패했습니다." };
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/my");
}
