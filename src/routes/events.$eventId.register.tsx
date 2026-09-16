import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegistrationForm } from "@/components/RegistrationForm";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { createRegistration, fetchEvents, formatDate } from "@/lib/api";
import type { RegistrationFormValues } from "@/lib/types";

export const Route = createFileRoute("/events/$eventId/register")({
  head: () => ({
    meta: [
      { title: "Event Registration Form — Campus Events" },
      {
        name: "description",
        content:
          "Fill in your name, email and department to register for a college event. Duplicate and full-event registrations are blocked.",
      },
      { property: "og:title", content: "Event Registration Form — Campus Events" },
      { property: "og:description", content: "Register for a college event in a few seconds." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({ queryKey: ["events"], queryFn: fetchEvents });
  const event = eventsQuery.data?.find((item) => item.id === eventId);

  const mutation = useMutation({
    mutationFn: (values: RegistrationFormValues) => createRegistration(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({ queryKey: ["registrations-total"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      toast.success("Registration completed successfully");
      navigate({ to: "/registrations" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/events">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to all events
        </Link>
      </Button>

      {eventsQuery.isLoading && <LoadingState label="Loading event…" />}

      {eventsQuery.isError && (
        <ErrorState
          message={(eventsQuery.error as Error).message}
          onRetry={() => eventsQuery.refetch()}
        />
      )}

      {eventsQuery.isSuccess && !event && (
        <ErrorState message="That event no longer exists. Please pick another event." />
      )}

      {event && (
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Register for {event.event_name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatDate(event.event_date)} · {event.venue} · {event.available_seats} seat(s)
              available
            </p>
          </CardHeader>
          <CardContent>
            {event.available_seats === 0 ? (
              <div className="space-y-4">
                <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
                  This event is full. No seats are available.
                </p>
                <Button asChild variant="outline">
                  <Link to="/events">Browse other events</Link>
                </Button>
              </div>
            ) : (
              <RegistrationForm
                events={eventsQuery.data ?? []}
                initialValues={{
                  student_name: "",
                  email: "",
                  department: "",
                  event_id: event.id,
                }}
                lockEvent
                submitLabel="Confirm Registration"
                submitting={mutation.isPending}
                onSubmit={(values) => mutation.mutate(values)}
                onCancel={() => navigate({ to: "/events" })}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
