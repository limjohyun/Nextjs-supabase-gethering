import { z } from "zod";

export const EVENT_CATEGORIES = ["수영", "헬스", "친구모임", "기타"] as const;

export const eventFormSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요."),
  description: z.string().optional(),
  category: z.enum(EVENT_CATEGORIES, "카테고리를 선택해주세요."),
  location: z.string().min(1, "장소를 입력해주세요."),
  eventDatetime: z.string().min(1, "일시를 입력해주세요."),
  capacity: z
    .number("정원을 입력해주세요.")
    .int()
    .min(1, "정원은 1명 이상이어야 합니다."),
  coverImageUrl: z
    .string()
    .url("올바른 URL을 입력해주세요.")
    .optional()
    .or(z.literal("")),
});

export type EventFormValues = z.infer<typeof eventFormSchema>;

/**
 * DB의 ISO timestamp를 <input type="datetime-local"> value 형식(로컬 시간 기준
 * "yyyy-MM-ddTHH:mm")으로 변환한다. toISOString()은 UTC로 변환해버려 그대로 쓰면
 * 표시 시각이 어긋나므로 로컬 Date 필드를 직접 조합한다.
 */
export function toDatetimeLocalValue(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
