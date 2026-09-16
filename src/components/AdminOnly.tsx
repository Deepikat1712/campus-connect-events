import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** Shown when a page or action needs organizer (admin) access. */
export function AdminOnly({ title = "Organizer access required", description }: {
  title?: string;
  description?: string;
}) {
  return (
    <Card className="card-elevated mx-auto max-w-lg">
      <CardContent className="space-y-4 py-10 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
          <ShieldAlert className="h-6 w-6 text-primary" />
        </span>
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">
          {description ??
            "Only signed-in organizers can add, edit or delete events and registrations."}
        </p>
        <div className="flex justify-center gap-2">
          <Button asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/events">Browse events</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
