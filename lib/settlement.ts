/**
 * 총액을 인원 수만큼 1/N로 나눈다. 나머지는 앞쪽부터 1원씩 배분해
 * 반환값의 합이 항상 totalAmount와 정확히 일치하도록 한다.
 */
export function splitEvenly(totalAmount: number, count: number): number[] {
  if (count <= 0) return [];

  const base = Math.floor(totalAmount / count);
  const remainder = totalAmount % count;

  return Array.from(
    { length: count },
    (_, i) => base + (i < remainder ? 1 : 0),
  );
}
