import { Link } from "@tanstack/react-router";
import { CalendarDays, GraduationCap, Home, Menu, Settings, Users } from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/registrations", label: "Registrations", icon: Users },
  { to: "/manage", label: "Manage Events", icon: Settings },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="brand-surface flex h-10 w-10 items-center justify-center rounded-xl">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold">Campus Events</span>
            <span className="block text-xs text-muted-foreground">
              College Event Registration System
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
              activeProps={{ className: "bg-secondary text-primary" }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          className="inline-flex items-center justify-center rounded-lg border border-border p-2 text-foreground transition-colors hover:bg-secondary md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <nav className="border-t border-border bg-card px-4 pb-4 md:hidden">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
              activeProps={{ className: "bg-secondary text-primary" }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
