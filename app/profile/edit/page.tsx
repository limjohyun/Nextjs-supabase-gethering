import Link from "next/link";
import { Suspense } from "react";

import { updateProfile } from "@/app/profile/actions";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { ProfileFormValues } from "@/lib/validations/profile";

async function ProfileEditContent() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) {
    return (
      <p className="text-muted-foreground text-sm">로그인이 필요합니다.</p>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, bio, website, avatar_url")
    .eq("id", user.id)
    .single();

  const defaultValues: Partial<ProfileFormValues> = {
    fullName: profile?.full_name ?? "",
    username: profile?.username ?? "",
    bio: profile?.bio ?? "",
    website: profile?.website ?? "",
    avatarUrl: profile?.avatar_url ?? "",
  };

  return (
    <ProfileEditForm
      defaultValues={defaultValues}
      onSubmitAction={updateProfile}
    />
  );
}

export default function ProfileEditPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">프로필 편집</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/profile">돌아가기</Link>
        </Button>
      </div>
      <Suspense
        fallback={
          <p className="text-muted-foreground text-sm">불러오는 중...</p>
        }
      >
        <ProfileEditContent />
      </Suspense>
    </div>
  );
}
