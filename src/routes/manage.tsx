import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, MapPin, Pencil, PlusCircle, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateViews";
import { deleteEvent, fetchEvents, formatDate } from "@/lib/api";
import type { EventWithCount } from "@/lib/types";

export const Route = createFileRoute("/manage")({
  head: () => ({
    meta: [
      { title: "Manage Events — Campus Events" },
      {
        name: "description",
        content:
          "Organizer dashboard to create, update and delete college events and track how many students registered for each one.",
      },
      { property: "og:title", content: "Manage Events — Campus Events" },
      {
        property: "og:description",
        content: "Create, edit and delete college events from one organizer dashboard.",
      },
    ],
  }),
  component: ManageEventsPage,
});

function ManageEventsPage() {
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<EventWithCount | null>(null);

  const eventsQuery = useQuery({ queryKey: ["events"], queryFn: fetchEvents });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({ queryKey: ["registrations-total"] });
      toast.success("Event deleted successfully");
      setPendingDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setPendingDelete(null);
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Manage Events</h1>
          <p className="mt-1 text-muted-foreground">
            Create, update and delete events for the college.
          </p>
        </div>
        <Button asChild>
          <Link to="/events/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Event
          </Link>
        </Button>
      </div>

      <div className="mt-8">
        {eventsQuery.isLoading && <LoadingState label="Loading events…" />}

        {eventsQuery.isError && (
          <ErrorState
            message={(eventsQuery.error as Error).message}
            onRetry={() => eventsQuery.refetch()}
          />
        )}

        {eventsQuery.isSuccess && eventsQuery.data.length === 0 && (
          <EmptyState
            title="No events yet"
            description="Add your first college event so students can register for it."
            action={
              <Button asChild>
                <Link to="/events/new">Add Event</Link>
              </Button>
            }
          />
        )}

        {eventsQuery.data && eventsQuery.data.length > 0 && (
          <div className="grid gap-4">
            {eventsQuery.data.map((event) => (
              <Card key={event.id} className="card-elevated">
                <CardContent className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl font-semibold">{event.event_name}</h2>
                      <Badge variant="secondary">{event.category}</Badge>
                      {event.available_seats === 0 && <Badge variant="destructive">Full</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        {formatDate(event.event_date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" />
                        {event.venue}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-primary" />
                        {event.registered_count} / {event.max_participants} registered
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to="/events/$eventId" params={{ eventId: event.id }}>
                        View Details
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/events/$eventId/edit" params={{ eventId: event.id }}>
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setPendingDelete(event)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `"${pendingDelete.event_name}" and its ${pendingDelete.registered_count} registration(s) will be permanently deleted.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep event</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
            >
              Yes, delete event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
