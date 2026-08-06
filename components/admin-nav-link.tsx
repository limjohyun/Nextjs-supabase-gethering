import Link from "next/link";

import { isAdmin } from "@/lib/auth/is-admin";

/** 관리자에게만 노출되는 네비게이션 링크. AuthButton과 동일하게 자체 Suspense 경계 안에서 렌더링된다. */
export async function AdminNavLink() {
  const admin = await isAdmin();

  if (!admin) {
    return null;
  }

  return <Link href="/admin">관리자</Link>;
}
