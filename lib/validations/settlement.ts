import { z } from "zod";

export const settlementItemFormSchema = z.object({
  name: z.string().min(1, "항목명을 입력해주세요."),
  amount: z
    .number("금액을 입력해주세요.")
    .int()
    .min(1, "금액은 1원 이상이어야 합니다."),
  payerIds: z.array(z.string()).min(1, "결제자를 1명 이상 선택해주세요."),
});

export type SettlementItemFormValues = z.infer<typeof settlementItemFormSchema>;
