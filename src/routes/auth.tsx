import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — Campus Events" },
      {
        name: "description",
        content:
          "Sign in to manage college events as an organizer, or to view your own event registrations as a student.",
      },
      { property: "og:title", content: "Sign In — Campus Events" },
      {
        property: "og:description",
        content: "Organizer and student sign-in for the College Event Registration System.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Email and password are required");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Account created. Check your email to confirm it, then sign in.");
          setMode("signin");
        } else {
          queryClient.invalidateQueries();
          toast.success("Account created and signed in");
          navigate({ to: "/" });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        queryClient.invalidateQueries();
        toast.success("Signed in successfully");
        navigate({ to: "/" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not complete the request");
    } finally {
      setBusy(false);
    }
  }

  async function handleClaimAdmin() {
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("claim_first_admin");
      if (error) throw error;
      if (data) {
        toast.success("You are now an organizer (admin). Reload to see Manage Events.");
        window.location.reload();
      } else {
        toast.error("An organizer already exists. Ask them to give you access.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not claim organizer access");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="font-display text-2xl">
            {user ? "Your account" : mode === "signin" ? "Sign in" : "Create an account"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Organizers manage events. Students can sign in to see their own registrations.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {user ? (
            <div className="space-y-4">
              <p className="text-sm">
                Signed in as <span className="font-medium">{user.email}</span>
                {isAdmin ? " (organizer)" : " (student)"}
              </p>
              {!isAdmin && (
                <div className="rounded-lg border border-border bg-secondary/40 p-4">
                  <p className="text-sm text-muted-foreground">
                    No organizer exists yet? The first signed-in user can claim organizer access.
                  </p>
                  <Button className="mt-3" onClick={handleClaimAdmin} disabled={busy}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Claim organizer access
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/events">Browse events</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link to="/registrations">My registrations</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@college.edu"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 6 characters"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>
              <button
                type="button"
                className="w-full text-sm text-primary hover:underline"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin"
                  ? "New here? Create an account"
                  : "Already have an account? Sign in"}
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
