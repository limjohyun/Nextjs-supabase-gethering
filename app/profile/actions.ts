"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  profileFormSchema,
  type ProfileFormValues,
} from "@/lib/validations/profile";

type ActionResult = { error: string } | undefined;

/** 프로필 편집 폼의 빈 문자열 필드를 DB에는 null로 저장한다 */
export async function updateProfile(
  values: ProfileFormValues,
): Promise<ActionResult> {
  const parsed = profileFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getClaims();
  const userId = userData?.claims?.sub as string | undefined;
  if (!userId) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      username: parsed.data.username || null,
      bio: parsed.data.bio || null,
      website: parsed.data.website || null,
      avatar_url: parsed.data.avatarUrl || null,
    })
    .eq("id", userId);

  if (error) {
    if (error.code === "23505") {
      return { error: "이미 사용 중인 아이디입니다." };
    }
    return { error: "프로필 저장에 실패했습니다." };
  }

  revalidatePath("/profile");
  redirect("/profile");
}

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
