"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { splitEvenly } from "@/lib/settlement";
import {
  settlementItemFormSchema,
  type SettlementItemFormValues,
} from "@/lib/validations/settlement";

type MockParticipant = { id: string; name: string };

const MOCK_PARTICIPANTS: MockParticipant[] = [
  { id: "p1", name: "김철수" },
  { id: "p2", name: "이영희" },
  { id: "p3", name: "박민수" },
];

// mock 단계 전용 sentinel — 실제 로그인 사용자가 아니며, 5-B에서 실제 auth.uid()로 교체된다.
const CURRENT_USER_ID = "p1";

type SettlementItem = {
  id: string;
  name: string;
  amount: number;
  payerIds: string[];
};

const initialItems: SettlementItem[] = [
  { id: "s1", name: "숙소비", amount: 300000, payerIds: ["p1"] },
  { id: "s2", name: "저녁 식사", amount: 90000, payerIds: ["p1", "p2"] },
];

function payerNames(payerIds: string[]): string {
  return payerIds
    .map(
      (id) => MOCK_PARTICIPANTS.find((p) => p.id === id)?.name ?? "알 수 없음",
    )
    .join(", ");
}

export function EventSettlementTab({ isHost }: { isHost: boolean }) {
  const [items, setItems] = useState<SettlementItem[]>(initialItems);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paidState, setPaidState] = useState<Record<string, boolean>>({
    p1: false,
    p2: true,
    p3: false,
  });

  const form = useForm<SettlementItemFormValues>({
    resolver: zodResolver(settlementItemFormSchema),
    defaultValues: { name: "", amount: 0, payerIds: [] },
  });

  function onSubmit(values: SettlementItemFormValues) {
    setIsSubmitting(true);
    setItems((prev) => [
      {
        id: crypto.randomUUID(),
        name: values.name,
        amount: values.amount,
        payerIds: values.payerIds,
      },
      ...prev,
    ]);
    form.reset({ name: "", amount: 0, payerIds: [] });
    setIsSubmitting(false);
  }

  function togglePaid(participantId: string) {
    setPaidState((prev) => ({
      ...prev,
      [participantId]: !prev[participantId],
    }));
  }

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const shares = splitEvenly(totalAmount, MOCK_PARTICIPANTS.length);

  return (
    <div className="flex flex-col gap-6">
      {isHost && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-3"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>항목명</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 숙소비" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>금액</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      name={field.name}
                      ref={field.ref}
                      value={field.value}
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
              name="payerIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>결제자</FormLabel>
                  <div className="flex flex-col gap-2">
                    {MOCK_PARTICIPANTS.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-2"
                      >
                        <FormControl>
                          <Checkbox
                            checked={(field.value ?? []).includes(
                              participant.id,
                            )}
                            onCheckedChange={(checked) =>
                              checked
                                ? field.onChange([
                                    ...(field.value ?? []),
                                    participant.id,
                                  ])
                                : field.onChange(
                                    (field.value ?? []).filter(
                                      (id) => id !== participant.id,
                                    ),
                                  )
                            }
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {participant.name}
                        </FormLabel>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="self-start"
            >
              {isSubmitting ? "처리 중..." : "비용 항목 등록"}
            </Button>
          </form>
        </Form>
      )}

      <div className="flex flex-col gap-3">
        <h3 className="text-muted-foreground text-sm font-semibold">
          비용 항목
        </h3>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            아직 등록된 비용 항목이 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <span className="text-sm font-medium">{item.name}</span>
                <span className="text-muted-foreground text-xs">
                  {item.amount.toLocaleString("ko-KR")}원 · 결제자{" "}
                  {payerNames(item.payerIds)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-muted-foreground text-sm font-semibold">
          참여자별 분담액 (총 {totalAmount.toLocaleString("ko-KR")}원)
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>참여자</TableHead>
              <TableHead>분담액</TableHead>
              <TableHead>정산 완료</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_PARTICIPANTS.map((participant, index) => (
              <TableRow key={participant.id}>
                <TableCell>{participant.name}</TableCell>
                <TableCell>{shares[index].toLocaleString("ko-KR")}원</TableCell>
                <TableCell>
                  <Checkbox
                    checked={paidState[participant.id] ?? false}
                    disabled={!isHost && participant.id !== CURRENT_USER_ID}
                    onCheckedChange={() => togglePaid(participant.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
