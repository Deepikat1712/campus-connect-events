import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventForm } from "@/components/EventForm";
import { AdminOnly } from "@/components/AdminOnly";
import { useAuth } from "@/hooks/useAuth";
import { createEvent } from "@/lib/api";
import type { EventFormValues } from "@/lib/types";

export const Route = createFileRoute("/events/new")({
  head: () => ({
    meta: [
      { title: "Add Event — Campus Events" },
      {
        name: "description",
        content:
          "Create a new college event with its category, date, venue, description and participant limit.",
      },
      { property: "og:title", content: "Add Event — Campus Events" },
      { property: "og:description", content: "Create a new college event in a single form." },
    ],
  }),
  component: AddEventPage,
});

function AddEventPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: EventFormValues) =>
      createEvent({
        event_name: values.event_name.trim(),
        category: values.category,
        event_date: values.event_date,
        venue: values.venue.trim(),
        description: values.description.trim() || null,
        max_participants: Number(values.max_participants),
      }),
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success(`"${event.event_name}" was created successfully`);
      navigate({ to: "/manage" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!authLoading && !isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <AdminOnly description="Only signed-in organizers can create new events." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/manage">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Manage Events
        </Link>
      </Button>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Add a new event</CardTitle>
          <p className="text-sm text-muted-foreground">
            Fields marked with * are required. Participants must be greater than 0.
          </p>
        </CardHeader>
        <CardContent>
          <EventForm
            submitLabel="Create Event"
            submitting={mutation.isPending}
            onSubmit={(values) => mutation.mutate(values)}
            onCancel={() => navigate({ to: "/manage" })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
