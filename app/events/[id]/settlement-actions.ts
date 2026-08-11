"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { settlementItemFormSchema } from "@/lib/validations/settlement";

type ActionResult = { error: string } | undefined;

/** 주최자가 비용 항목을 등록한다. */
export async function registerSettlementItem(
  eventId: string,
  values: { name: string; amount: number; payerIds: string[] },
): Promise<ActionResult> {
  const parsed = settlementItemFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("register_settlement_item", {
    p_event_id: eventId,
    p_item_name: parsed.data.name,
    p_amount: parsed.data.amount,
    p_payer_ids: parsed.data.payerIds,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
}

/** 주최자 또는 본인이 정산 완료 여부를 변경한다. */
export async function toggleSettlementPaid(
  eventId: string,
  participantUserId: string,
  isPaid: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("settlement_shares")
    .update({ is_paid: isPaid })
    .eq("event_id", eventId)
    .eq("user_id", participantUserId);

  if (error) {
    return { error: "정산 완료 상태 변경에 실패했습니다." };
  }

  revalidatePath(`/events/${eventId}`);
}
