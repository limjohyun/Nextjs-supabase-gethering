import { createClient } from "@/lib/supabase/server";

/**
 * 현재 로그인한 사용자가 관리자(profiles.role = 'admin')인지 확인한다.
 * 로그인하지 않았거나 관리자가 아니면 false를 반환한다.
 * 실제 판정은 DB의 is_admin() 함수(SECURITY DEFINER)에 위임해 판정 로직을 한 곳에서만 관리한다.
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getClaims();

  if (!userData?.claims) {
    return false;
  }

  const { data } = await supabase.rpc("is_admin");
  return data === true;
}
