"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { carpoolFormSchema } from "@/lib/validations/carpool";

type ActionResult = { error: string } | undefined;

/** 로그인한 사용자가 자신을 운전자로 카풀을 등록한다. */
export async function createCarpool(
  eventId: string,
  values: {
    departureLocation: string;
    departureTime: string;
    seatCount: number;
  },
): Promise<ActionResult> {
  const parsed = carpoolFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getClaims();
  const userId = userData?.claims?.sub as string | undefined;
  if (!userId) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase.from("carpools").insert({
    event_id: eventId,
    driver_id: userId,
    departure_location: parsed.data.departureLocation,
    departure_time: new Date(parsed.data.departureTime).toISOString(),
    seat_count: parsed.data.seatCount,
  });

  if (error) {
    return { error: "카풀 등록에 실패했습니다." };
  }

  revalidatePath(`/events/${eventId}`);
}

/** 로그인한 사용자가 카풀 좌석을 신청한다. */
export async function applyForSeat(
  eventId: string,
  carpoolId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getClaims();
  const userId = userData?.claims?.sub as string | undefined;
  if (!userId) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase.from("carpool_requests").insert({
    carpool_id: carpoolId,
    user_id: userId,
  });

  if (error) {
    return { error: "좌석 신청에 실패했습니다." };
  }

  revalidatePath(`/events/${eventId}`);
}

/** 카풀 운전자가 좌석 신청을 확정한다. */
export async function confirmCarpoolRequest(
  eventId: string,
  requestId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_carpool_request", {
    request_id: requestId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
}
