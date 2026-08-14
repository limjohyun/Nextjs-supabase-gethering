import Link from "next/link";
import { Suspense } from "react";
import { AdminNavLink } from "@/components/admin-nav-link";
import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { hasEnvVars } from "@/lib/utils";

export function MainNav() {
  return (
    <nav className="border-b-foreground/10 hidden h-16 w-full justify-center border-b lg:flex">
      <div className="flex w-full max-w-5xl items-center justify-between p-3 px-5 text-sm">
        <div className="flex items-center gap-5 font-semibold">
          <Link href="/events">모임 목록</Link>
          <Link href="/events/new">모임 만들기</Link>
          <Link href="/my">내 모임</Link>
          <Link href="/profile">프로필</Link>
          <Suspense fallback={null}>
            <AdminNavLink />
          </Suspense>
        </div>
        {!hasEnvVars ? (
          <EnvVarWarning />
        ) : (
          <Suspense>
            <AuthButton />
          </Suspense>
        )}
      </div>
    </nav>
  );
}
