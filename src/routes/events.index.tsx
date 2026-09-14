import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventCard } from "@/components/EventCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateViews";
import { fetchEvents } from "@/lib/api";
import { EVENT_CATEGORIES } from "@/lib/types";

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "All Events — Campus Events" },
      {
        name: "description",
        content:
          "Search college events by name, filter by category and see the date, venue and available seats for each event.",
      },
      { property: "og:title", content: "All Events — Campus Events" },
      {
        property: "og:description",
        content: "Search and filter every college event, then register for the ones you like.",
      },
    ],
  }),
  component: EventsPage,
});

const ALL = "all";

function EventsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(ALL);

  const eventsQuery = useQuery({ queryKey: ["events"], queryFn: fetchEvents });

  const filtered = useMemo(() => {
    const events = eventsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    return events.filter((event) => {
      const matchesSearch = term === "" || event.event_name.toLowerCase().includes(term);
      const matchesCategory = category === ALL || event.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [eventsQuery.data, search, category]);

  const filtersActive = search.trim() !== "" || category !== ALL;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">College Events</h1>
          <p className="mt-1 text-muted-foreground">
            {eventsQuery.data ? `${eventsQuery.data.length} events in total` : "Loading events…"}
          </p>
        </div>
        <Button asChild>
          <Link to="/events/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Event
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by event name…"
            className="pl-9"
            aria-label="Search events by name"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-56" aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {EVENT_CATEGORIES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            setSearch("");
            setCategory(ALL);
          }}
          disabled={!filtersActive}
        >
          <X className="mr-2 h-4 w-4" />
          Clear filters
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

        {eventsQuery.isSuccess && filtered.length === 0 && (
          <EmptyState
            title={filtersActive ? "No events match your search" : "No events yet"}
            description={
              filtersActive
                ? "Try a different event name or clear the filters to see everything."
                : "Create the first college event to get started."
            }
            action={
              filtersActive ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setCategory(ALL);
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/events/new">Add Event</Link>
                </Button>
              )
            }
          />
        )}

        {filtered.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
