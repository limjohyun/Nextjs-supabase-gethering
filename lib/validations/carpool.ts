import { z } from "zod";

export const carpoolFormSchema = z.object({
  departureLocation: z.string().min(1, "출발지를 입력해주세요."),
  departureTime: z.string().min(1, "출발 시간을 입력해주세요."),
  seatCount: z
    .number("좌석 수를 입력해주세요.")
    .int()
    .min(1, "좌석 수는 1석 이상이어야 합니다."),
});

export type CarpoolFormValues = z.infer<typeof carpoolFormSchema>;
