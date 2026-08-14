"use client";

import { Calendar, Home, Plus, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

// 모바일 하단 탭바에 표시할 탭 목록
const NAV_ITEMS = [
  {
    href: "/events",
    label: "모임 목록",
    icon: Home,
    // "/events"는 활성 처리하되 "/events/new"는 별도 탭이므로 제외
    isActive: (pathname: string) =>
      pathname === "/events" ||
      (pathname.startsWith("/events/") && pathname !== "/events/new"),
  },
  {
    href: "/my",
    label: "내 모임",
    icon: Calendar,
    isActive: (pathname: string) => pathname.startsWith("/my"),
  },
  {
    href: "/events/new",
    label: "모임 만들기",
    icon: Plus,
    isActive: (pathname: string) => pathname === "/events/new",
  },
  {
    href: "/profile",
    label: "프로필",
    icon: User,
    isActive: (pathname: string) => pathname.startsWith("/profile"),
  },
] as const;

/**
 * 모바일 화면 전용 하단 고정 탭바
 * 현재 경로에 해당하는 탭을 강조 표시하고, lg 이상 화면에서는 숨김 처리한다
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="모바일 하단 내비게이션"
      className="bg-background fixed right-0 bottom-0 left-0 z-50 flex h-16 border-t lg:hidden"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon, isActive }) => {
        const active = isActive(pathname);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            // 터치 타겟이 WCAG 최소 권장 크기(44x44px)를 확보하도록 각 탭이
            // 하단 탭바 전체 높이(h-16)와 균등 너비(flex-1)를 채우게 한다
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-xs",
              active ? "text-foreground font-medium" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
