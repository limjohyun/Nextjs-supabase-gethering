"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import {
  profileFormSchema,
  type ProfileFormValues,
} from "@/lib/validations/profile";

export function ProfileEditForm({
  defaultValues,
  onSubmitAction,
}: {
  defaultValues?: Partial<ProfileFormValues>;
  onSubmitAction: (
    values: ProfileFormValues,
  ) => Promise<{ error: string } | undefined>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(
    null,
  );

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: "",
      username: "",
      bio: "",
      website: "",
      avatarUrl: "",
      ...defaultValues,
    },
  });

  const avatarUrl = useWatch({ control: form.control, name: "avatarUrl" });
  const fullName = useWatch({ control: form.control, name: "fullName" });

  async function handleAvatarFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploadError(null);
    setIsUploadingAvatar(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setAvatarUploadError("로그인이 필요합니다.");
        return;
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${user.id}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file);
      if (uploadError) {
        setAvatarUploadError("이미지 업로드에 실패했습니다.");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      form.setValue("avatarUrl", publicUrl, {
        shouldValidate: true,
        shouldDirty: true,
      });
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  }

  async function onSubmit(values: ProfileFormValues) {
    setServerError(null);
    setIsSubmitting(true);
    const result = await onSubmitAction(values);
    setIsSubmitting(false);
    if (result?.error) {
      setServerError(result.error);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
            <AvatarFallback className="text-lg">
              {fullName?.charAt(0) ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div className="grid gap-2">
            <Label htmlFor="avatar-file">아바타 이미지</Label>
            <Input
              id="avatar-file"
              type="file"
              accept="image/*"
              disabled={isUploadingAvatar}
              onChange={handleAvatarFileChange}
            />
            {isUploadingAvatar && (
              <p className="text-muted-foreground text-xs">업로드 중...</p>
            )}
            {avatarUploadError && (
              <p className="text-destructive text-xs">{avatarUploadError}</p>
            )}
          </div>
        </div>
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이름</FormLabel>
              <FormControl>
                <Input placeholder="예: 홍길동" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>닉네임</FormLabel>
              <FormControl>
                <Input placeholder="예: swimming_lover" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>자기소개</FormLabel>
              <FormControl>
                <Textarea placeholder="자기소개를 입력해주세요." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>웹사이트</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {serverError && (
          <p className="text-destructive text-sm">{serverError}</p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : "저장"}
        </Button>
      </form>
    </Form>
  );
}
