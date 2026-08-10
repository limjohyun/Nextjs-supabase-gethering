"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

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

// mock 단계 전용 sentinel — 실제 로그인 사용자가 아니며, 4-B에서 실제 auth.uid()로 교체된다.
const CURRENT_USER_ID = "me";

const initialCarpools: CarpoolData[] = [
  {
    id: "c1",
    driverId: CURRENT_USER_ID,
    driverName: "나",
    departureLocation: "강남역 2번 출구",
    departureTime: "2026-08-15T08:00:00+09:00",
    seatCount: 3,
    requests: [
      { id: "r1", requesterName: "김철수", status: "confirmed" },
      { id: "r2", requesterName: "이영희", status: "pending" },
    ],
  },
  {
    id: "c2",
    driverId: "u2",
    driverName: "박민수",
    departureLocation: "잠실역 3번 출구",
    departureTime: "2026-08-15T08:30:00+09:00",
    seatCount: 2,
    requests: [
      { id: "r3", requesterName: "최지훈", status: "confirmed" },
      { id: "r4", requesterName: "정다은", status: "confirmed" },
    ],
  },
];

export function EventCarpoolTab() {
  const [carpools, setCarpools] = useState<CarpoolData[]>(initialCarpools);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CarpoolFormValues>({
    resolver: zodResolver(carpoolFormSchema),
    defaultValues: { departureLocation: "", departureTime: "", seatCount: 1 },
  });

  function onSubmit(values: CarpoolFormValues) {
    setIsSubmitting(true);
    setCarpools((prev) => [
      {
        id: crypto.randomUUID(),
        driverId: CURRENT_USER_ID,
        driverName: "나",
        departureLocation: values.departureLocation,
        departureTime: values.departureTime,
        seatCount: values.seatCount,
        requests: [],
      },
      ...prev,
    ]);
    form.reset({ departureLocation: "", departureTime: "", seatCount: 1 });
    setIsSubmitting(false);
  }

  function handleApplySeat(carpoolId: string) {
    setCarpools((prev) =>
      prev.map((carpool) =>
        carpool.id === carpoolId
          ? {
              ...carpool,
              requests: [
                ...carpool.requests,
                {
                  id: crypto.randomUUID(),
                  requesterName: "나",
                  status: "pending",
                },
              ],
            }
          : carpool,
      ),
    );
  }

  function handleConfirmRequest(carpoolId: string, requestId: string) {
    setCarpools((prev) =>
      prev.map((carpool) =>
        carpool.id === carpoolId
          ? {
              ...carpool,
              requests: carpool.requests.map((request) =>
                request.id === requestId
                  ? { ...request, status: "confirmed" }
                  : request,
              ),
            }
          : carpool,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-6">
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
          <Button type="submit" disabled={isSubmitting} className="self-start">
            {isSubmitting ? "처리 중..." : "카풀 등록"}
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
              const isDriver = carpool.driverId === CURRENT_USER_ID;
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
                                  disabled={isFull}
                                  onClick={() =>
                                    handleConfirmRequest(carpool.id, request.id)
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
