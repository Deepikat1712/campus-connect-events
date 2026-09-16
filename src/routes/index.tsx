import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  PlusCircle,
  Ticket,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EventCard } from "@/components/EventCard";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { fetchEvents, fetchTotalRegistrations, isUpcoming } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Campus Events — College Event Registration System" },
      {
        name: "description",
        content:
          "Browse college events, check available seats and register online. Organizers can create, edit and manage every event.",
      },
      { property: "og:title", content: "Campus Events — College Event Registration System" },
      {
        property: "og:description",
        content: "Browse college events, check seats and register online in a few clicks.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const eventsQuery = useQuery({ queryKey: ["events"], queryFn: fetchEvents });
  const registrationsQuery = useQuery({
    queryKey: ["registrations-total"],
    queryFn: fetchTotalRegistrations,
  });


  const events = eventsQuery.data ?? [];
  const totalEvents = events.length;
  const upcomingEvents = events.filter((event) => isUpcoming(event.event_date)).length;
  const availableEvents = events.filter(
    (event) => isUpcoming(event.event_date) && event.available_seats > 0,
  ).length;
  const totalRegistrations = registrationsQuery.data ?? 0;

  const stats = [
    { label: "Total Events", value: totalEvents, icon: CalendarDays },
    { label: "Total Registrations", value: totalRegistrations, icon: Users },
    { label: "Upcoming Events", value: upcomingEvents, icon: CalendarCheck },
    { label: "Available Events", value: availableEvents, icon: Ticket },
  ];

  const featured = events.filter((event) => isUpcoming(event.event_date)).slice(0, 3);
  const loading = eventsQuery.isLoading || registrationsQuery.isLoading;

  return (
    <div>
      <section className="hero-surface border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm font-medium text-primary">
            <ClipboardList className="h-4 w-4" />
            College activity project · 2026
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-tight sm:text-5xl">
            One place for every college event and student registration
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Create and manage technical fests, cultural nights, workshops, seminars and sports meets.
            Students can browse events, check available seats and register in seconds.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/events">
                <CalendarDays className="mr-2 h-5 w-5" />
                View Events
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/events/new">
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Event
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl font-bold">Dashboard statistics</h2>
        <p className="mt-1 text-muted-foreground">Live numbers straight from the database.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="card-elevated">
              <CardContent className="flex items-center gap-4 py-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                  <Icon className="h-6 w-6 text-primary" />
                </span>
                <span>
                  <span className="block font-display text-3xl font-bold">
                    {loading ? "—" : value}
                  </span>
                  <span className="block text-sm text-muted-foreground">{label}</span>
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold">Upcoming events</h2>
            <p className="mt-1 text-muted-foreground">The next events open for registration.</p>
          </div>
          <Button asChild variant="ghost">
            <Link to="/events">See all events</Link>
          </Button>
        </div>

        <div className="mt-6">
          {loading && <LoadingState label="Loading events…" />}
          {eventsQuery.isError && (
            <ErrorState
              message={(eventsQuery.error as Error).message}
              onRetry={() => eventsQuery.refetch()}
            />
          )}
          {!loading && !eventsQuery.isError && featured.length === 0 && (
            <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
              No upcoming events yet. Add the first one from Manage Events.
            </p>
          )}
          {featured.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
