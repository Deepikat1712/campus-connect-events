import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/api";
import type { EventWithCount, RegistrationFormValues } from "@/lib/types";
import { validateRegistrationForm, type FormErrors } from "@/lib/validation";

interface RegistrationFormProps {
  events: EventWithCount[];
  initialValues?: RegistrationFormValues;
  lockEvent?: boolean;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (values: RegistrationFormValues) => void;
  onCancel: () => void;
}

export function RegistrationForm({
  events,
  initialValues,
  lockEvent = false,
  submitLabel,
  submitting = false,
  onSubmit,
  onCancel,
}: RegistrationFormProps) {
  const [values, setValues] = useState<RegistrationFormValues>(
    initialValues ?? { student_name: "", email: "", department: "", event_id: "" },
  );
  const [errors, setErrors] = useState<FormErrors<RegistrationFormValues>>({});

  function setField(field: keyof RegistrationFormValues, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  }

  function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    const validationErrors = validateRegistrationForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    onSubmit({
      ...values,
      student_name: values.student_name.trim(),
      email: values.email.trim().toLowerCase(),
      department: values.department.trim(),
    });
  }

  const selectedEvent = events.find((event) => event.id === values.event_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="student_name">Student name *</Label>
        <Input
          id="student_name"
          value={values.student_name}
          onChange={(event) => setField("student_name", event.target.value)}
          placeholder="e.g. Deepika T"
        />
        {errors.student_name && <p className="text-sm text-destructive">{errors.student_name}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={values.email}
            onChange={(event) => setField("email", event.target.value)}
            placeholder="student@college.edu"
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <Input
            id="department"
            value={values.department}
            onChange={(event) => setField("department", event.target.value)}
            placeholder="e.g. Computer Science"
          />
          {errors.department && <p className="text-sm text-destructive">{errors.department}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="event_id">Event *</Label>
        <Select
          value={values.event_id}
          onValueChange={(value) => setField("event_id", value)}
          disabled={lockEvent}
        >
          <SelectTrigger id="event_id">
            <SelectValue placeholder="Select an event" />
          </SelectTrigger>
          <SelectContent>
            {events.map((event) => (
              <SelectItem key={event.id} value={event.id} disabled={event.available_seats === 0}>
                {event.event_name} · {formatDate(event.event_date)}
                {event.available_seats === 0 ? " (Full)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.event_id && <p className="text-sm text-destructive">{errors.event_id}</p>}
        {selectedEvent && (
          <p className="text-sm text-muted-foreground">
            {selectedEvent.venue} · {selectedEvent.available_seats} of{" "}
            {selectedEvent.max_participants} seats available
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
