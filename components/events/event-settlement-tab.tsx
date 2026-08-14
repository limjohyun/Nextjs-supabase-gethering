"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  registerSettlementItem,
  toggleSettlementPaid,
} from "@/app/events/[id]/settlement-actions";
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
import {
  settlementItemFormSchema,
  type SettlementItemFormValues,
} from "@/lib/validations/settlement";

export type SettlementItemData = {
  itemId: string;
  name: string;
  amount: number;
  payerNames: string[];
};

export type SettlementParticipantData = {
  userId: string;
  name: string;
  amountOwed: number;
  isPaid: boolean;
  hasShare: boolean;
};

export function EventSettlementTab({
  eventId,
  isHost,
  currentUserId,
  participants,
  items,
}: {
  eventId: string;
  isHost: boolean;
  currentUserId: string | undefined;
  participants: SettlementParticipantData[];
  items: SettlementItemData[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SettlementItemFormValues>({
    resolver: zodResolver(settlementItemFormSchema),
    defaultValues: { name: "", amount: 0, payerIds: [] },
  });

  function onSubmit(values: SettlementItemFormValues) {
    setError(null);
    startTransition(async () => {
      const result = await registerSettlementItem(eventId, values);
      if (result?.error) {
        setError(result.error);
        return;
      }
      form.reset({ name: "", amount: 0, payerIds: [] });
      router.refresh();
    });
  }

  function handleTogglePaid(participantUserId: string, isPaid: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await toggleSettlementPaid(
        eventId,
        participantUserId,
        isPaid,
      );
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-destructive text-sm">{error}</p>}

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
              name="payerIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>결제자</FormLabel>
                  <div className="flex flex-col gap-2">
                    {participants.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        승인된 참여자가 없습니다.
                      </p>
                    ) : (
                      participants.map((participant) => (
                        <div
                          key={participant.userId}
                          className="flex items-center gap-2"
                        >
                          <FormControl>
                            <Checkbox
                              checked={(field.value ?? []).includes(
                                participant.userId,
                              )}
                              onCheckedChange={(checked) =>
                                checked
                                  ? field.onChange([
                                      ...(field.value ?? []),
                                      participant.userId,
                                    ])
                                  : field.onChange(
                                      (field.value ?? []).filter(
                                        (id) => id !== participant.userId,
                                      ),
                                    )
                              }
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {participant.name}
                          </FormLabel>
                        </div>
                      ))
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="self-start">
              {isPending ? "처리 중..." : "비용 항목 등록"}
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
                key={item.itemId}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <span className="text-sm font-medium">{item.name}</span>
                <span className="text-muted-foreground text-xs">
                  {item.amount.toLocaleString("ko-KR")}원 · 결제자{" "}
                  {item.payerNames.join(", ")}
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
        {participants.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            승인된 참여자가 없습니다.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>참여자</TableHead>
                <TableHead>분담액</TableHead>
                <TableHead>정산 완료</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((participant) => (
                <TableRow key={participant.userId}>
                  <TableCell>{participant.name}</TableCell>
                  <TableCell>
                    {participant.amountOwed.toLocaleString("ko-KR")}원
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={participant.isPaid}
                      disabled={
                        isPending ||
                        !participant.hasShare ||
                        (!isHost && participant.userId !== currentUserId)
                      }
                      onCheckedChange={(checked) =>
                        handleTogglePaid(participant.userId, checked === true)
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
