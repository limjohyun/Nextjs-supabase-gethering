"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  applyForSeat,
  confirmCarpoolRequest,
  createCarpool,
} from "@/app/events/[id]/carpool-actions";
import { Badge } from "@/components/ui/badge";
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
  carpoolFormSchema,
  type CarpoolFormValues,
} from "@/lib/validations/carpool";

export type CarpoolRequestData = {
  id: string;
  requesterName: string;
  status: "pending" | "confirmed";
};

export type CarpoolData = {
  id: string;
  driverId: string;
  driverName: string;
  departureLocation: string;
  departureTime: string;
  seatCount: number;
  requests: CarpoolRequestData[];
};

export function EventCarpoolTab({
  eventId,
  currentUserId,
  carpools,
}: {
  eventId: string;
  currentUserId: string | undefined;
  carpools: CarpoolData[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CarpoolFormValues>({
    resolver: zodResolver(carpoolFormSchema),
    defaultValues: { departureLocation: "", departureTime: "", seatCount: 1 },
  });

  function onSubmit(values: CarpoolFormValues) {
    setError(null);
    startTransition(async () => {
      const result = await createCarpool(eventId, values);
      if (result?.error) {
        setError(result.error);
        return;
      }
      form.reset({ departureLocation: "", departureTime: "", seatCount: 1 });
      router.refresh();
    });
  }

  function handleApplySeat(carpoolId: string) {
    setError(null);
    startTransition(async () => {
      const result = await applyForSeat(eventId, carpoolId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleConfirmRequest(requestId: string) {
    setError(null);
    startTransition(async () => {
      const result = await confirmCarpoolRequest(eventId, requestId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-destructive text-sm">{error}</p>}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
        >
          <FormField
            control={form.control}
            name="departureLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>출발지</FormLabel>
                <FormControl>
                  <Input placeholder="예: 강남역 2번 출구" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="departureTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>출발 시간</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="seatCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>좌석 수</FormLabel>
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
          <Button type="submit" disabled={isPending} className="self-start">
            {isPending ? "처리 중..." : "카풀 등록"}
          </Button>
        </form>
      </Form>

      <div className="flex flex-col gap-3">
        <h3 className="text-muted-foreground text-sm font-semibold">
          카풀 목록
        </h3>
        {carpools.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            아직 등록된 카풀이 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {carpools.map((carpool) => {
              const isDriver = carpool.driverId === currentUserId;
              const confirmedCount = carpool.requests.filter(
                (request) => request.status === "confirmed",
              ).length;
              const isFull = confirmedCount >= carpool.seatCount;

              return (
                <li
                  key={carpool.id}
                  className="flex flex-col gap-3 rounded-md border p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        {carpool.departureLocation}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(carpool.departureTime).toLocaleString(
                          "ko-KR",
                        )}{" "}
                        · 운전자 {carpool.driverName}
                      </span>
                    </div>
                    <Badge variant={isFull ? "secondary" : "outline"}>
                      {confirmedCount}/{carpool.seatCount}석 확정
                    </Badge>
                  </div>

                  {isDriver ? (
                    <div className="flex flex-col gap-2">
                      <h4 className="text-muted-foreground text-xs font-semibold">
                        신청 목록
                      </h4>
                      {carpool.requests.length === 0 ? (
                        <p className="text-muted-foreground text-xs">
                          아직 신청한 사람이 없습니다.
                        </p>
                      ) : (
                        <ul className="flex flex-col gap-2">
                          {carpool.requests.map((request) => (
                            <li
                              key={request.id}
                              className="flex items-center justify-between"
                            >
                              <span className="text-sm">
                                {request.requesterName}
                              </span>
                              {request.status === "confirmed" ? (
                                <Badge variant="default">확정됨</Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isPending || isFull}
                                  onClick={() =>
                                    handleConfirmRequest(request.id)
                                  }
                                >
                                  확정
                                </Button>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="self-start"
                      disabled={isPending}
                      onClick={() => handleApplySeat(carpool.id)}
                    >
                      좌석 신청
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
