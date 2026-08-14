"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

/** 구글 OAuth 로그인 버튼 (login/sign-up 폼 공용) */
export function GoogleSignInButton({ next }: { next?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const redirectTo =
        next && next !== "/"
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
          : `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          // 매번 계정 선택 화면을 띄워, 브라우저에 남아있는 구글 세션으로
          // 자동 재인증되지 않고 명시적으로 계정을 고르도록 강제한다.
          queryParams: {
            prompt: "select_account",
          },
        },
      });
      if (error) throw error;
      // 성공 시 브라우저가 구글 로그인 페이지로 이동하므로 별도 후속 처리 불필요
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.49-1.13 2.76-2.4 3.6v3h3.88c2.27-2.09 3.57-5.17 3.57-8.79z"
            fill="#4285F4"
          />
          <path
            d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.1C3.25 21.3 7.31 24 12 24z"
            fill="#34A853"
          />
          <path
            d="M5.27 14.3c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3v-3.1H1.27A11.96 11.96 0 000 12c0 1.94.46 3.77 1.27 5.4l4-3.1z"
            fill="#FBBC05"
          />
          <path
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.6l4 3.1c.95-2.84 3.6-4.95 6.73-4.95z"
            fill="#EA4335"
          />
        </svg>
        {isLoading ? "이동 중..." : "Google로 계속하기"}
      </Button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
