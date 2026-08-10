"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type ActionResult = { error: string } | undefined;

/** 관리자가 대상 사용자의 권한(user/admin)을 변경하는 유일한 공식 경로. */
export async function setUserRole(
  targetUserId: string,
  newRole: "user" | "admin",
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("set_user_role", {
    target_user_id: targetUserId,
    new_role: newRole,
  });

  if (error) {
    return { error: "권한 변경에 실패했습니다." };
  }

  revalidatePath("/admin");
}
