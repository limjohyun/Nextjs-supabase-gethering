export default function MyEventsPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">내 모임</h1>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">주최한 모임</h2>
        <p className="text-sm text-muted-foreground">
          아직 주최한 모임이 없습니다.
        </p>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">참여한 모임</h2>
        <p className="text-sm text-muted-foreground">
          아직 참여한 모임이 없습니다.
        </p>
      </section>
    </div>
  );
}
