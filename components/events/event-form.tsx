"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import {
  EVENT_CATEGORIES,
  eventFormSchema,
  type EventFormValues,
} from "@/lib/validations/event";

export function EventForm({
  defaultValues,
  submitLabel = "모임 만들기",
  onSubmitAction,
}: {
  defaultValues?: Partial<EventFormValues>;
  submitLabel?: string;
  onSubmitAction: (
    values: EventFormValues,
  ) => Promise<{ error: string } | undefined>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [debouncedCoverUrl, setDebouncedCoverUrl] = useState("");
  const [coverUrlPreviewFailed, setCoverUrlPreviewFailed] = useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      eventDatetime: "",
      capacity: 1,
      coverImageUrl: "",
      ...defaultValues,
    },
  });

  const coverImageUrl = useWatch({
    control: form.control,
    name: "coverImageUrl",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCoverUrl(coverImageUrl ?? "");
      setCoverUrlPreviewFailed(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [coverImageUrl]);

  async function handleCoverImageFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverUploadError(null);
    setIsUploadingCover(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setCoverUploadError("로그인이 필요합니다.");
        return;
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${user.id}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("event-covers")
        .upload(path, file);
      if (uploadError) {
        setCoverUploadError("이미지 업로드에 실패했습니다.");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("event-covers").getPublicUrl(path);
      form.setValue("coverImageUrl", publicUrl, {
        shouldValidate: true,
        shouldDirty: true,
      });
    } finally {
      setIsUploadingCover(false);
      e.target.value = "";
    }
  }

  async function onSubmit(values: EventFormValues) {
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
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>제목</FormLabel>
              <FormControl>
                <Input placeholder="예: 주말 수영 모임" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>설명</FormLabel>
              <FormControl>
                <Textarea placeholder="모임 소개를 입력해주세요." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>카테고리</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="카테고리를 선택해주세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EVENT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>장소</FormLabel>
              <FormControl>
                <Input placeholder="예: 올림픽수영장" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="eventDatetime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>일시</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>정원</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  name={field.name}
                  ref={field.ref}
                  value={Number.isNaN(field.value) ? "" : field.value}
                  onBlur={field.onBlur}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="coverImageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>커버 이미지 URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {debouncedCoverUrl && (
          <div className="flex items-center gap-2">
            {!coverUrlPreviewFailed ? (
              <img
                src={debouncedCoverUrl}
                alt="커버 이미지 미리보기"
                className="h-16 w-16 rounded-md object-cover"
                onError={() => setCoverUrlPreviewFailed(true)}
              />
            ) : (
              <div className="bg-muted text-muted-foreground flex h-16 w-16 items-center justify-center rounded-md">
                <ImageIcon className="size-5" aria-hidden="true" />
              </div>
            )}
            {coverUrlPreviewFailed && (
              <p className="text-destructive text-xs">
                이 URL은 이미지로 표시할 수 없습니다. 실제 이미지 파일 링크인지
                확인하거나 아래 파일 업로드를 이용해주세요.
              </p>
            )}
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="cover-image-file">또는 이미지 파일 업로드</Label>
          <Input
            id="cover-image-file"
            type="file"
            accept="image/*"
            disabled={isUploadingCover}
            onChange={handleCoverImageFileChange}
          />
          {isUploadingCover && (
            <p className="text-muted-foreground text-xs">업로드 중...</p>
          )}
          {coverUploadError && (
            <p className="text-destructive text-xs">{coverUploadError}</p>
          )}
        </div>
        {serverError && (
          <p className="text-destructive text-sm">{serverError}</p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "처리 중..." : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
