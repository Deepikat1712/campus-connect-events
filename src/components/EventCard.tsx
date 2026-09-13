import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, Tag, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, isUpcoming } from "@/lib/api";
import type { EventWithCount } from "@/lib/types";

export function EventCard({ event }: { event: EventWithCount }) {
  const full = event.available_seats === 0;
  const upcoming = isUpcoming(event.event_date);

  return (
    <Card className="card-elevated flex h-full flex-col">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Tag className="h-3 w-3" />
            {event.category}
          </Badge>
          {full ? (
            <Badge variant="destructive">Full</Badge>
          ) : (
            <Badge variant="outline">{event.available_seats} seats left</Badge>
          )}
          {!upcoming && <Badge variant="outline">Completed</Badge>}
        </div>
        <CardTitle className="font-display text-xl">{event.event_name}</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          {formatDate(event.event_date)}
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          {event.venue}
        </p>
        <p className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          {event.registered_count} / {event.max_participants} registered
        </p>
        {event.description && (
          <p className="line-clamp-2 pt-1 text-foreground/80">{event.description}</p>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="flex-1">
          <Link to="/events/$eventId" params={{ eventId: event.id }}>
            View Details
          </Link>
        </Button>
        <Button asChild className="flex-1" disabled={full || !upcoming}>
          <Link to="/events/$eventId/register" params={{ eventId: event.id }}>
            {full ? "Event Full" : "Register"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
