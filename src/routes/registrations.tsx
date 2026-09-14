import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Mail, Pencil, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RegistrationForm } from "@/components/RegistrationForm";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateViews";
import {
  deleteRegistration,
  fetchEvents,
  fetchRegistrations,
  formatDate,
  updateRegistration,
} from "@/lib/api";
import type { RegistrationFormValues, RegistrationWithEvent } from "@/lib/types";

export const Route = createFileRoute("/registrations")({
  head: () => ({
    meta: [
      { title: "Registrations — Campus Events" },
      {
        name: "description",
        content:
          "View every student registration with name, email, department, event and registration date. Edit or cancel a registration anytime.",
      },
      { property: "og:title", content: "Registrations — Campus Events" },
      {
        property: "og:description",
        content: "All student event registrations in one list, with edit and cancel actions.",
      },
    ],
  }),
  component: RegistrationsPage,
});

function RegistrationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<RegistrationWithEvent | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RegistrationWithEvent | null>(null);

  const registrationsQuery = useQuery({ queryKey: ["registrations"], queryFn: fetchRegistrations });
  const eventsQuery = useQuery({ queryKey: ["events"], queryFn: fetchEvents });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: RegistrationFormValues }) =>
      updateRegistration(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Registration updated successfully");
      setEditing(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRegistration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Registration cancelled");
      setPendingDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setPendingDelete(null);
    },
  });

  const filtered = useMemo(() => {
    const rows = registrationsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (row) =>
        row.student_name.toLowerCase().includes(term) ||
        row.email.toLowerCase().includes(term) ||
        row.event_name.toLowerCase().includes(term) ||
        row.department.toLowerCase().includes(term),
    );
  }, [registrationsQuery.data, search]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Student Registrations</h1>
          <p className="mt-1 text-muted-foreground">
            {registrationsQuery.data
              ? `${registrationsQuery.data.length} registration(s) stored in the database`
              : "Loading registrations…"}
          </p>
        </div>
        <Button asChild>
          <Link to="/events">Register for an event</Link>
        </Button>
      </div>

      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by student, email, department or event…"
          className="pl-9"
          aria-label="Search registrations"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-8">
        {registrationsQuery.isLoading && <LoadingState label="Loading registrations…" />}

        {registrationsQuery.isError && (
          <ErrorState
            message={(registrationsQuery.error as Error).message}
            onRetry={() => registrationsQuery.refetch()}
          />
        )}

        {registrationsQuery.isSuccess && filtered.length === 0 && (
          <EmptyState
            title={search ? "No matching registrations" : "No registrations yet"}
            description={
              search
                ? "Try another name, email or event."
                : "Once students register for an event, their details appear here."
            }
            action={
              <Button asChild>
                <Link to="/events">Browse events</Link>
              </Button>
            }
          />
        )}

        {filtered.length > 0 && (
          <>
            {/* Table on larger screens */}
            <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Registered on</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} className="border-t border-border transition-colors hover:bg-secondary/40">
                      <td className="px-4 py-3 font-medium">{row.student_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.department}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{row.event_name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatDate(row.event_date)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(row.registered_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditing(row)}>
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setPendingDelete(row)}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards on mobile */}
            <div className="grid gap-4 md:hidden">
              {filtered.map((row) => (
                <Card key={row.id} className="card-elevated">
                  <CardContent className="space-y-2 py-5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-display text-lg font-semibold">{row.student_name}</h2>
                      <Badge variant="secondary">{row.event_category}</Badge>
                    </div>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {row.email}
                    </p>
                    <p className="text-sm text-muted-foreground">{row.department}</p>
                    <p className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      {row.event_name} · {formatDate(row.event_date)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Registered on {formatDate(row.registered_at)}
                    </p>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setEditing(row)}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => setPendingDelete(row)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit registration</DialogTitle>
          </DialogHeader>
          {editing && (
            <RegistrationForm
              events={eventsQuery.data ?? []}
              initialValues={{
                student_name: editing.student_name,
                email: editing.email,
                department: editing.department,
                event_id: editing.event_id,
              }}
              submitLabel="Save Changes"
              submitting={updateMutation.isPending}
              onSubmit={(values) => updateMutation.mutate({ id: editing.id, values })}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this registration?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `${pendingDelete.student_name}'s registration for "${pendingDelete.event_name}" will be permanently removed.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
            >
              Yes, cancel registration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
