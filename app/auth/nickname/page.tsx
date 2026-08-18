import { Suspense } from "react";

import { setNickname } from "@/app/auth/nickname/actions";
import { NicknameForm } from "@/components/auth/nickname-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { toUsernameCandidate } from "@/lib/validations/profile";

async function NicknameContent({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getClaims();
  const userId = userData?.claims?.sub as string | undefined;

  const { data: profile } = userId
    ? await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", userId)
        .maybeSingle()
    : { data: null };

  return (
    <Card>
      <CardHeader>
        <CardTitle>닉네임을 정해주세요</CardTitle>
        <CardDescription>
          모임에서 다른 참여자들에게 표시될 닉네임이에요. 나중에 프로필에서 바꿀
          수 있어요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <NicknameForm
          defaultUsername={toUsernameCandidate(profile?.full_name ?? "")}
          onSubmitAction={setNickname.bind(null, next)}
        />
      </CardContent>
    </Card>
  );
}

export default function NicknamePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={null}>
          <NicknameContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
