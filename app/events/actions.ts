"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { eventFormSchema, type EventFormValues } from "@/lib/validations/event";

type ActionResult = { error: string } | undefined;

export async function createEvent(
  values: EventFormValues,
): Promise<ActionResult> {
  const parsed = eventFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getClaims();
  const hostId = userData?.claims?.sub as string | undefined;
  if (!hostId) {
    return { error: "로그인이 필요합니다." };
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      host_id: hostId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      category: parsed.data.category,
      location: parsed.data.location,
      event_datetime: new Date(parsed.data.eventDatetime).toISOString(),
      capacity: parsed.data.capacity,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "모임 생성에 실패했습니다." };
  }

  revalidatePath("/events");
  redirect(`/events/${data.id}`);
}

export async function updateEvent(
  eventId: string,
  values: EventFormValues,
): Promise<ActionResult> {
  const parsed = eventFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      category: parsed.data.category,
      location: parsed.data.location,
      event_datetime: new Date(parsed.data.eventDatetime).toISOString(),
      capacity: parsed.data.capacity,
    })
    .eq("id", eventId);

  if (error) {
    return { error: "모임 수정에 실패했습니다." };
  }

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  redirect(`/events/${eventId}`);
}

export async function cancelEvent(eventId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ status: "cancelled" })
    .eq("id", eventId);

  if (error) {
    return { error: "모임 취소에 실패했습니다." };
  }

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
}
