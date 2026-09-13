/**
 * Shared types for the College Event Registration System.
 */

export const EVENT_CATEGORIES = [
  "Technical",
  "Cultural",
  "Sports",
  "Workshop",
  "Seminar",
  "Other",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export interface CollegeEvent {
  id: string;
  event_name: string;
  category: string;
  event_date: string;
  venue: string;
  description: string | null;
  max_participants: number;
  created_at: string;
}

/** An event plus how many students have registered for it. */
export interface EventWithCount extends CollegeEvent {
  registered_count: number;
  available_seats: number;
}

export interface Registration {
  id: string;
  student_name: string;
  email: string;
  department: string;
  event_id: string;
  registered_at: string;
}

/** A registration joined with the name/date of its event. */
export interface RegistrationWithEvent extends Registration {
  event_name: string;
  event_date: string;
  event_category: string;
}

export interface EventFormValues {
  event_name: string;
  category: string;
  event_date: string;
  venue: string;
  description: string;
  max_participants: string;
}

export interface RegistrationFormValues {
  student_name: string;
  email: string;
  department: string;
  event_id: string;
}
