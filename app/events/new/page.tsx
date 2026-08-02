import { createEvent } from "@/app/events/actions";
import { EventForm } from "@/components/events/event-form";

export default function NewEventPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">모임 만들기</h1>
      <EventForm submitLabel="모임 만들기" onSubmitAction={createEvent} />
    </div>
  );
}
