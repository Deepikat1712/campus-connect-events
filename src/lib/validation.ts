/**
 * Simple form validation helpers. Each function returns an object of
 * field name -> error message. An empty object means the form is valid.
 */
import { EVENT_CATEGORIES, type EventFormValues, type RegistrationFormValues } from "./types";

export type FormErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEventForm(values: EventFormValues): FormErrors<EventFormValues> {
  const errors: FormErrors<EventFormValues> = {};

  if (!values.event_name.trim()) {
    errors.event_name = "Event name is required";
  } else if (values.event_name.trim().length < 3) {
    errors.event_name = "Event name must be at least 3 characters";
  }

  if (!values.category) {
    errors.category = "Please choose a category";
  } else if (!EVENT_CATEGORIES.includes(values.category as (typeof EVENT_CATEGORIES)[number])) {
    errors.category = "Please choose a valid category";
  }

  if (!values.event_date) errors.event_date = "Event date is required";
  if (!values.venue.trim()) errors.venue = "Venue is required";

  const max = Number(values.max_participants);
  if (!values.max_participants.trim()) {
    errors.max_participants = "Maximum participants is required";
  } else if (!Number.isInteger(max) || max <= 0) {
    errors.max_participants = "Maximum participants must be greater than 0";
  }

  return errors;
}

export function validateRegistrationForm(
  values: RegistrationFormValues,
): FormErrors<RegistrationFormValues> {
  const errors: FormErrors<RegistrationFormValues> = {};

  if (!values.student_name.trim()) {
    errors.student_name = "Student name is required";
  } else if (values.student_name.trim().length < 3) {
    errors.student_name = "Student name must be at least 3 characters";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Please enter a valid email";
  }

  if (!values.department.trim()) errors.department = "Department is required";
  if (!values.event_id) errors.event_id = "Please select an event";

  return errors;
}
