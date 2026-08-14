"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error: string } | undefined;

/** 현재 로그인 사용자의 계정을 완전히 삭제한다(profiles 등 연관 데이터는 on delete cascade로 자동 정리됨) */
export async function deleteAccount(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(user.id);
  if (error) {
    return { error: "계정 삭제에 실패했습니다." };
  }

  await supabase.auth.signOut();
  redirect("/auth/login");
}
