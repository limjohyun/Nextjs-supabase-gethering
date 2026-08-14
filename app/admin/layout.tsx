import { redirect } from "next/navigation";
import { Suspense } from "react";

import { BottomNav } from "@/components/bottom-nav";
import { MainNav } from "@/components/main-nav";
import { isAdmin } from "@/lib/auth/is-admin";

async function AdminGate({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();

  if (!admin) {
    redirect("/");
  }

  return <>{children}</>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center">
      <MainNav />
      <div className="flex w-full max-w-5xl flex-1 flex-col gap-8 p-5 pb-20 lg:pb-5">
        <Suspense
          fallback={
            <p className="text-muted-foreground text-sm">불러오는 중...</p>
          }
        >
          <AdminGate>{children}</AdminGate>
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
