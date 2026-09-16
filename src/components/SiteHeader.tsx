import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  GraduationCap,
  Home,
  LogIn,
  LogOut,
  Menu,
  Settings,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/events", label: "Events", icon: CalendarDays },
    { to: "/registrations", label: "Registrations", icon: Users },
    ...(isAdmin ? [{ to: "/manage", label: "Manage Events", icon: Settings }] : []),
  ] as const;

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/", replace: true });
  }

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
          {navItems.map(({ to, label, icon: Icon }) => (
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

          {user ? (
            <div className="ml-2 flex items-center gap-2 border-l border-border pl-3">
              <span className="max-w-[10rem] truncate text-xs text-muted-foreground">
                {user.email}
                {isAdmin ? " · Admin" : ""}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-1 h-3.5 w-3.5" />
                Sign out
              </Button>
            </div>
          ) : (
            <Button asChild size="sm" className="ml-2">
              <Link to="/auth">
                <LogIn className="mr-1 h-3.5 w-3.5" />
                Sign in
              </Link>
            </Button>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation menu"
          className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-secondary md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <nav className="border-t border-border bg-card px-4 pb-4 pt-2 md:hidden">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary"
              activeProps={{ className: "bg-secondary text-primary" }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}

          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary"
            >
              <LogOut className="h-4 w-4" />
              Sign out ({user.email})
            </button>
          ) : (
            <Link
              to="/auth"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-primary hover:bg-secondary"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
