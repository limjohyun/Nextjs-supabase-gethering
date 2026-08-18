import { z } from "zod";

/** 닉네임 설정/프로필 편집 폼이 공유하는 username 필드 스키마 */
export const usernameSchema = z
  .string()
  .min(3, "닉네임은 3자 이상이어야 합니다.")
  .max(20, "닉네임은 20자 이하여야 합니다.")
  .regex(/^[a-zA-Z0-9_]+$/, "영문/숫자/밑줄만 사용할 수 있어요.")
  .optional()
  .or(z.literal(""));

export const nicknameFormSchema = z.object({
  username: usernameSchema,
});

export type NicknameFormValues = z.infer<typeof nicknameFormSchema>;

export const profileFormSchema = z.object({
  fullName: z.string().min(1, "이름을 입력해주세요."),
  username: usernameSchema,
  bio: z.string().optional(),
  website: z
    .string()
    .url("올바른 URL을 입력해주세요.")
    .optional()
    .or(z.literal("")),
  avatarUrl: z
    .string()
    .url("올바른 URL을 입력해주세요.")
    .optional()
    .or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

/**
 * OAuth 제공자의 이름(예: "홍길동", "John Doe")을 닉네임 기본값 후보로 변환한다.
 * 한글 등 usernameSchema가 허용하지 않는 문자는 모두 제거되므로, 결과가 3자
 * 미만이면 빈 문자열을 반환해 사용자가 직접 입력하도록 한다.
 */
export function toUsernameCandidate(name: string) {
  const candidate = name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "");
  return candidate.length >= 3 ? candidate : "";
}
