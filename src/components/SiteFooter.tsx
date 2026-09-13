import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold">Campus Events</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            College Event Registration System — a full-stack CRUD project for managing college
            events and student registrations.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Quick links</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/events" className="transition-colors hover:text-primary">
                Browse events
              </Link>
            </li>
            <li>
              <Link to="/registrations" className="transition-colors hover:text-primary">
                My registrations
              </Link>
            </li>
            <li>
              <Link to="/manage" className="transition-colors hover:text-primary">
                Manage events
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Project information</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Built with React, TypeScript and Tailwind CSS</li>
            <li>Postgres database with full CRUD operations</li>
            <li>Academic year 2026 — college activity project</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Campus Events · College Event Registration System
      </div>
    </footer>
  );
}
