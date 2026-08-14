import Link from "next/link";
import { Suspense } from "react";

import { CalendarCheck, Megaphone, Users } from "lucide-react";

import { AuthButton } from "@/components/auth-button";
import { BottomNav } from "@/components/bottom-nav";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "간편한 모임 생성",
    description:
      "제목, 일시, 장소, 정원만 입력하면 바로 모임을 만들 수 있어요.",
  },
  {
    icon: Users,
    title: "참여자 승인 관리",
    description: "참여 신청을 확인하고 승인·거절해 인원을 정확히 파악하세요.",
  },
  {
    icon: Megaphone,
    title: "공지·카풀·정산까지 한 곳에서",
    description: "모임별 공지, 카풀 좌석, 비용 정산을 한 페이지에서 관리해요.",
  },
];

async function LandingCta() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    return (
      <Button asChild size="lg">
        <Link href="/events">모임 목록 보기</Link>
      </Button>
    );
  }

  return (
    <Button asChild size="lg">
      <Link href="/auth/login">시작하기</Link>
    </Button>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="flex w-full flex-1 flex-col items-center gap-12 pb-20 lg:gap-20 lg:pb-0">
        <nav className="border-b-foreground/10 hidden h-16 w-full justify-center border-b lg:flex">
          <div className="flex w-full max-w-5xl items-center justify-between p-3 px-5 text-sm">
            <Link href="/" className="font-semibold">
              모임 이벤트 관리
            </Link>
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense>
                <AuthButton />
              </Suspense>
            )}
          </div>
        </nav>

        <div className="flex max-w-2xl flex-1 flex-col items-center gap-6 p-5 pt-10 text-center sm:pt-5">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            모임 이벤트 관리
          </h1>
          <p className="text-muted-foreground max-w-xl text-base sm:text-lg">
            수영·헬스·친구모임의 공지·참여자·카풀·정산을 한 곳에서 관리하세요.
          </p>
          <Suspense
            fallback={
              <Button size="lg" disabled>
                불러오는 중...
              </Button>
            }
          >
            <LandingCta />
          </Suspense>
        </div>

        <div className="grid w-full max-w-5xl gap-4 px-5 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardHeader className="gap-2">
                <feature.icon className="text-muted-foreground h-6 w-6" />
                <CardTitle className="text-base">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <footer className="mx-auto flex w-full items-center justify-center gap-8 border-t py-16 text-center text-xs">
          <p>
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
            로 만들었습니다
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </main>
  );
}
