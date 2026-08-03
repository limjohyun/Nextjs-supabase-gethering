import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { updateEvent } from "@/app/events/actions";
import { EventForm } from "@/components/events/event-form";
import { createClient } from "@/lib/supabase/server";
import {
  toDatetimeLocalValue,
  type EventFormValues,
} from "@/lib/validations/event";

async function EditEventContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: event, error }, { data: userData }] = await Promise.all([
    supabase.from("events").select("*").eq("id", id).single(),
    supabase.auth.getClaims(),
  ]);

  if (error || !event) {
    notFound();
  }

  const currentUserId = userData?.claims?.sub as string | undefined;
  if (currentUserId !== event.host_id) {
    redirect(`/events/${id}`);
  }

  const defaultValues: Partial<EventFormValues> = {
    title: event.title,
    description: event.description ?? "",
    category: event.category as EventFormValues["category"],
    location: event.location,
    eventDatetime: toDatetimeLocalValue(event.event_datetime),
    capacity: event.capacity,
    coverImageUrl: event.cover_image_url ?? "",
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">모임 수정</h1>
      <EventForm
        submitLabel="저장"
        defaultValues={defaultValues}
        onSubmitAction={updateEvent.bind(null, id)}
      />
    </div>
  );
}

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">불러오는 중...</p>}
    >
      <EditEventContent params={params} />
    </Suspense>
  );
}
