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
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailNotConfirmed, setIsEmailNotConfirmed] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    setIsEmailNotConfirmed(false);
    setResendSent(false);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (isAuthApiError(error) && error.code === "email_not_confirmed") {
          setIsEmailNotConfirmed(true);
          setError(
            "이메일 인증이 완료되지 않았습니다. 받으신 메일함을 확인해주세요.",
          );
          return;
        }
        throw error;
      }
      router.push("/");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  async function handleResendConfirmation() {
    const supabase = createClient();
    setIsResending(true);
    setResendSent(false);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setIsResending(false);
    if (!error) setResendSent(true);
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>
            이메일을 입력해 계정에 로그인하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
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
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    비밀번호를 잊으셨나요?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              {isEmailNotConfirmed && (
                <div className="flex flex-col items-start gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isResending}
                    onClick={handleResendConfirmation}
                  >
                    {isResending ? "재전송 중..." : "인증 메일 재전송"}
                  </Button>
                  {resendSent && (
                    <p className="text-muted-foreground text-xs">
                      인증 메일을 다시 보냈습니다.
                    </p>
                  )}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "로그인 중..." : "로그인"}
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
            <GoogleSignInButton />
            <div className="mt-4 text-center text-sm">
              계정이 없으신가요?{" "}
              <Link
                href="/auth/sign-up"
                className="underline underline-offset-4"
              >
                회원가입
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
