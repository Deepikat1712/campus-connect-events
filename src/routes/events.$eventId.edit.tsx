import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventForm } from "@/components/EventForm";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { fetchEventById, updateEvent } from "@/lib/api";
import type { EventFormValues } from "@/lib/types";

export const Route = createFileRoute("/events/$eventId/edit")({
  head: () => ({
    meta: [
      { title: "Edit Event — Campus Events" },
      {
        name: "description",
        content: "Update the name, category, date, venue, description or seat limit of an event.",
      },
      { property: "og:title", content: "Edit Event — Campus Events" },
      { property: "og:description", content: "Update the details of an existing college event." },
    ],
  }),
  component: EditEventPage,
});

function EditEventPage() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const eventQuery = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => fetchEventById(eventId),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (values: EventFormValues) =>
      updateEvent(eventId, {
        event_name: values.event_name.trim(),
        category: values.category,
        event_date: values.event_date,
        venue: values.venue.trim(),
        description: values.description.trim() || null,
        max_participants: Number(values.max_participants),
      }),
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      toast.success(`"${event.event_name}" was updated successfully`);
      navigate({ to: "/manage" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/manage">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Manage Events
        </Link>
      </Button>

      {eventQuery.isLoading && <LoadingState label="Loading event…" />}

      {(eventQuery.isError || (eventQuery.isSuccess && !eventQuery.data)) && (
        <ErrorState
          message={(eventQuery.error as Error)?.message ?? "Event not found."}
          onRetry={() => eventQuery.refetch()}
        />
      )}

      {eventQuery.data && (
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Edit event</CardTitle>
            <p className="text-sm text-muted-foreground">
              {eventQuery.data.registered_count} student(s) already registered. Keep the participant
              limit at or above this number.
            </p>
          </CardHeader>
          <CardContent>
            <EventForm
              initialValues={{
                event_name: eventQuery.data.event_name,
                category: eventQuery.data.category,
                event_date: eventQuery.data.event_date,
                venue: eventQuery.data.venue,
                description: eventQuery.data.description ?? "",
                max_participants: String(eventQuery.data.max_participants),
              }}
              submitLabel="Save Changes"
              submitting={mutation.isPending}
              onSubmit={(values) => mutation.mutate(values)}
              onCancel={() => navigate({ to: "/manage" })}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
