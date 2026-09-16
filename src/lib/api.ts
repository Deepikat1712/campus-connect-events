/**
 * All database access for the app lives here, so pages stay focused on UI.
 * Uses the Lovable Cloud (Postgres) client.
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  CollegeEvent,
  EventWithCount,
  Registration,
  RegistrationWithEvent,
} from "./types";

/** Turns a raw database error into a message a student can understand. */
export function friendlyError(error: unknown): string {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error ?? "Something went wrong");

  if (message.includes("registrations_unique_email_per_event") || message.includes("duplicate key")) {
    return "This email is already registered for this event";
  }
  if (message.toLowerCase().includes("already full")) {
    return "This event is full. No seats are available.";
  }
  if (message.includes("Event does not exist") || message.includes("violates foreign key")) {
    return "That event no longer exists. Please refresh and pick another event.";
  }
  if (message.includes("max_participants")) {
    return "Maximum participants must be greater than 0";
  }
  if (message.toLowerCase().includes("failed to fetch") || message.toLowerCase().includes("network")) {
    return "Could not reach the server. Please check your connection and try again.";
  }
  return message;
}

/* ------------------------------- Events -------------------------------- */

/**
 * Seat counts come from a safe database helper that returns only totals,
 * so visitors never see student names or emails.
 */
async function fetchRegistrationCounts(): Promise<Map<string, number>> {
  const { data, error } = await supabase.rpc("event_registration_counts");
  if (error) throw new Error(friendlyError(error));
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.event_id as string, Number(row.registered_count ?? 0));
  }
  return counts;
}

export async function fetchTotalRegistrations(): Promise<number> {
  const { data, error } = await supabase.rpc("total_registrations");
  if (error) throw new Error(friendlyError(error));
  return Number(data ?? 0);
}

export async function fetchEvents(): Promise<EventWithCount[]> {
  const [eventsResult, counts] = await Promise.all([
    supabase.from("events").select("*").order("event_date", { ascending: true }),
    fetchRegistrationCounts(),
  ]);

  if (eventsResult.error) throw new Error(friendlyError(eventsResult.error));

  return (eventsResult.data ?? []).map((event) => {
    const registered = counts.get(event.id) ?? 0;
    return {
      ...(event as CollegeEvent),
      registered_count: registered,
      available_seats: Math.max(event.max_participants - registered, 0),
    };
  });
}

export async function fetchEventById(id: string): Promise<EventWithCount> {
  const [eventResult, counts] = await Promise.all([
    supabase.from("events").select("*").eq("id", id).maybeSingle(),
    fetchRegistrationCounts(),
  ]);

  if (eventResult.error) throw new Error(friendlyError(eventResult.error));
  if (!eventResult.data) throw new Error("Event not found. It may have been deleted.");

  const event = eventResult.data as CollegeEvent;
  const registered = counts.get(event.id) ?? 0;
  return {
    ...event,
    registered_count: registered,
    available_seats: Math.max(event.max_participants - registered, 0),
  };
}


export interface EventInput {
  event_name: string;
  category: string;
  event_date: string;
  venue: string;
  description: string | null;
  max_participants: number;
}

export async function createEvent(input: EventInput): Promise<CollegeEvent> {
  const { data, error } = await supabase.from("events").insert(input).select().single();
  if (error) throw new Error(friendlyError(error));
  return data as CollegeEvent;
}

export async function updateEvent(id: string, input: EventInput): Promise<CollegeEvent> {
  const { data, error } = await supabase
    .from("events")
    .update(input)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(friendlyError(error));
  if (!data) throw new Error("Event not found. It may have been deleted.");
  return data as CollegeEvent;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(friendlyError(error));
}

/* ---------------------------- Registrations ---------------------------- */

export async function fetchRegistrations(): Promise<RegistrationWithEvent[]> {
  const { data, error } = await supabase
    .from("registrations")
    .select("*, events(event_name, event_date, category)")
    .order("registered_at", { ascending: false });

  if (error) throw new Error(friendlyError(error));

  return (data ?? []).map((row) => {
    const { events, ...registration } = row as Registration & {
      events: { event_name: string; event_date: string; category: string } | null;
    };
    return {
      ...registration,
      event_name: events?.event_name ?? "Deleted event",
      event_date: events?.event_date ?? "",
      event_category: events?.category ?? "Other",
    };
  });
}

export interface RegistrationInput {
  student_name: string;
  email: string;
  department: string;
  event_id: string;
}

export async function createRegistration(input: RegistrationInput): Promise<Registration> {
  const { data, error } = await supabase.from("registrations").insert(input).select().single();
  if (error) throw new Error(friendlyError(error));
  return data as Registration;
}

export async function updateRegistration(
  id: string,
  input: RegistrationInput,
): Promise<Registration> {
  const { data, error } = await supabase
    .from("registrations")
    .update(input)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(friendlyError(error));
  if (!data) throw new Error("Registration not found. It may have been cancelled already.");
  return data as Registration;
}

export async function deleteRegistration(id: string): Promise<void> {
  const { error } = await supabase.from("registrations").delete().eq("id", id);
  if (error) throw new Error(friendlyError(error));
}

/* -------------------------- Helper functions --------------------------- */

export function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function isUpcoming(eventDate: string): boolean {
  if (!eventDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(eventDate) >= today;
}
