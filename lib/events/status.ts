/**
 * 이벤트의 표시용 상태(예정/종료/취소됨)를 계산하는 유틸.
 *
 * `events` 테이블의 `status` 컬럼은 현재 'open' | 'cancelled' 값만 사용하며,
 * "진행 중" 여부를 가릴 별도의 종료 시각 컬럼이 없어 예정/종료 2단계로만 구분한다.
 */
export type EventDisplayStatus = "예정" | "종료" | "취소됨";

/**
 * 이벤트 일시와 원본 상태값을 받아 화면에 노출할 표시 상태를 계산한다.
 * @param eventDatetime 이벤트 일시(ISO 문자열)
 * @param status 이벤트 원본 상태값('open' | 'cancelled')
 * @returns 표시용 상태 문자열
 */
export function getEventDisplayStatus(
  eventDatetime: string,
  status: string,
): EventDisplayStatus {
  if (status === "cancelled") return "취소됨";
  return new Date(eventDatetime) > new Date() ? "예정" : "종료";
}

/**
 * 표시 상태별 Badge variant 매핑.
 * `components/events/event-participants-tab.tsx`의 STATUS_VARIANT 컨벤션을 따른다.
 */
export const EVENT_DISPLAY_STATUS_VARIANT: Record<
  EventDisplayStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  예정: "outline",
  종료: "secondary",
  취소됨: "destructive",
};
