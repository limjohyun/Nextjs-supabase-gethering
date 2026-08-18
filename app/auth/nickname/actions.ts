"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  nicknameFormSchema,
  type NicknameFormValues,
} from "@/lib/validations/profile";

type ActionResult = { error: string } | undefined;

/** 닉네임 최초 설정 시 열린 리다이렉트 방지를 위해 내부 경로만 허용한다 */
function toSafeNext(next: string | undefined) {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/";
}

/**
 * next를 첫 인자로 두는 이유: Server Component에서 클라이언트 폼에
 * onSubmitAction={setNickname.bind(null, next)}로 넘겨야 하는데(인라인 화살표
 * 함수는 Client Component prop으로 직렬화할 수 없어 런타임 에러가 남),
 * bind()는 선행 인자만 미리 채울 수 있어 폼이 채우는 values는 뒤에 와야 한다.
 */
export async function setNickname(
  next: string | undefined,
  values: NicknameFormValues,
): Promise<ActionResult> {
  const parsed = nicknameFormSchema.safeParse(values);
  if (!parsed.success || !parsed.data.username) {
    return { error: "닉네임을 입력해주세요." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getClaims();
  const userId = userData?.claims?.sub as string | undefined;
  if (!userId) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ username: parsed.data.username })
    .eq("id", userId);

  if (error) {
    if (error.code === "23505") {
      return { error: "이미 사용 중인 아이디입니다." };
    }
    return { error: "닉네임 저장에 실패했습니다." };
  }

  redirect(toSafeNext(next));
}
