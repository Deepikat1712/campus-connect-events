import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Pencil,
  Tag,
  Ticket,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { fetchEventById, formatDate, isUpcoming } from "@/lib/api";

export const Route = createFileRoute("/events/$eventId/")({
  head: () => ({
    meta: [
      { title: "Event Details — Campus Events" },
      {
        name: "description",
        content:
          "See the full details of a college event: category, date, venue, description, participant limit and available seats.",
      },
      { property: "og:title", content: "Event Details — Campus Events" },
      {
        property: "og:description",
        content: "Full details and live seat availability for this college event.",
      },
    ],
  }),
  component: EventDetailsPage,
});

function EventDetailsPage() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();

  const eventQuery = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => fetchEventById(eventId),
    retry: false,
  });

  if (eventQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <LoadingState label="Loading event details…" />
      </div>
    );
  }

  if (eventQuery.isError || !eventQuery.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <ErrorState
          message={(eventQuery.error as Error)?.message ?? "Event not found."}
          onRetry={() => eventQuery.refetch()}
        />
        <div className="mt-4 text-center">
          <Button asChild variant="outline">
            <Link to="/events">Back to all events</Link>
          </Button>
        </div>
      </div>
    );
  }

  const event = eventQuery.data;
  const full = event.available_seats === 0;
  const upcoming = isUpcoming(event.event_date);

  const details = [
    { label: "Category", value: event.category, icon: Tag },
    { label: "Date", value: formatDate(event.event_date), icon: CalendarDays },
    { label: "Venue", value: event.venue, icon: MapPin },
    {
      label: "Registered",
      value: `${event.registered_count} of ${event.max_participants}`,
      icon: Users,
    },
    { label: "Available seats", value: String(event.available_seats), icon: Ticket },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/events">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to all events
        </Link>
      </Button>

      <Card className="card-elevated">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{event.category}</Badge>
            {full ? (
              <Badge variant="destructive">Full</Badge>
            ) : (
              <Badge variant="outline">{event.available_seats} seats left</Badge>
            )}
            {!upcoming && <Badge variant="outline">Completed</Badge>}
          </div>
          <CardTitle className="font-display text-3xl">{event.event_name}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            {details.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg border border-border bg-secondary/40 p-4">
                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4 text-primary" />
                  {label}
                </dt>
                <dd className="mt-1 font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <div>
            <h2 className="font-display text-lg font-semibold">About this event</h2>
            <p className="mt-2 text-muted-foreground">
              {event.description?.trim() ? event.description : "No description was added yet."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              disabled={full || !upcoming}
              onClick={() =>
                navigate({ to: "/events/$eventId/register", params: { eventId: event.id } })
              }
            >
              {full ? "Event Full" : upcoming ? "Register for this event" : "Registration closed"}
            </Button>
            <Button asChild variant="outline">
              <Link to="/events/$eventId/edit" params={{ eventId: event.id }}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit event
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
