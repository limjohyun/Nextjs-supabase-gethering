import { z } from "zod";

export const announcementFormSchema = z.object({
  content: z.string().min(1, "공지 내용을 입력해주세요."),
});

export type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;
