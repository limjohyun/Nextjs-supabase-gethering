"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

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
import {
  nicknameFormSchema,
  type NicknameFormValues,
} from "@/lib/validations/profile";

export function NicknameForm({
  defaultUsername = "",
  onSubmitAction,
}: {
  defaultUsername?: string;
  onSubmitAction: (
    values: NicknameFormValues,
  ) => Promise<{ error: string } | undefined>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NicknameFormValues>({
    resolver: zodResolver(nicknameFormSchema),
    defaultValues: {
      username: defaultUsername,
    },
  });

  async function onSubmit(values: NicknameFormValues) {
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
        {serverError && (
          <p className="text-destructive text-sm">{serverError}</p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : "시작하기"}
        </Button>
      </form>
    </Form>
  );
}
