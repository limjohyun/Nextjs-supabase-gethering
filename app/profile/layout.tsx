import { Suspense } from "react";

import { BottomNav } from "@/components/bottom-nav";
import { MainNav } from "@/components/main-nav";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center">
      <MainNav />
      <div className="flex w-full max-w-5xl flex-1 flex-col gap-8 p-5 pb-20 sm:pb-5">
        {children}
      </div>
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
