"use client";

import { isAuthApiError } from "@supabase/supabase-js";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GoogleSignInButton } from "@/components/google-signin-button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/";

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    setIsDuplicateEmail(false);

    if (password !== repeatPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        if (isAuthApiError(error) && error.code === "user_already_exists") {
          setIsDuplicateEmail(true);
          setError("이미 가입된 이메일입니다. 로그인해주세요.");
          return;
        }
        throw error;
      }
      // "이메일 확인"이 켜져 있고 기존 계정이 이미 확인된 상태면, Supabase는 계정
      // 열거(enumeration) 공격을 막기 위해 에러 없이 identities가 빈 배열인
      // user를 반환한다. 이 경우도 사실상 "이미 가입된 이메일"이다.
      if (
        data.user &&
        data.user.identities &&
        data.user.identities.length === 0
      ) {
        setIsDuplicateEmail(true);
        setError("이미 가입된 이메일입니다. 로그인해주세요.");
        return;
      }
      if (data.session) {
        router.push(next);
      } else {
        router.push("/auth/sign-up-success");
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <CardDescription>새 계정을 만듭니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">비밀번호</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">비밀번호 확인</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && (
                <p className="text-sm text-red-500">
                  {error}
                  {isDuplicateEmail && (
                    <>
                      {" "}
                      <Link
                        href="/auth/login"
                        className="underline underline-offset-4"
                      >
                        로그인하기
                      </Link>
                    </>
                  )}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "계정 만드는 중..." : "회원가입"}
              </Button>
            </div>
            <div className="relative my-4">
              <Separator />
              <span className="absolute inset-0 -top-2.5 flex justify-center">
                <span className="bg-card text-muted-foreground px-2 text-xs">
                  또는
                </span>
              </span>
            </div>
            <GoogleSignInButton next={next} />
            <div className="mt-4 text-center text-sm">
              이미 계정이 있으신가요?{" "}
              <Link
                href={
                  next !== "/"
                    ? `/auth/login?next=${encodeURIComponent(next)}`
                    : "/auth/login"
                }
                className="underline underline-offset-4"
              >
                로그인
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
