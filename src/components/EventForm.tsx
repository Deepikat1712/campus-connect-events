import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_CATEGORIES, type EventFormValues } from "@/lib/types";
import { validateEventForm, type FormErrors } from "@/lib/validation";

const EMPTY_EVENT: EventFormValues = {
  event_name: "",
  category: "",
  event_date: "",
  venue: "",
  description: "",
  max_participants: "",
};

interface EventFormProps {
  initialValues?: EventFormValues;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (values: EventFormValues) => void;
  onCancel: () => void;
}

export function EventForm({
  initialValues,
  submitLabel,
  submitting = false,
  onSubmit,
  onCancel,
}: EventFormProps) {
  const [values, setValues] = useState<EventFormValues>(initialValues ?? EMPTY_EVENT);
  const [errors, setErrors] = useState<FormErrors<EventFormValues>>({});

  function setField(field: keyof EventFormValues, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  }

  function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    const validationErrors = validateEventForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="event_name">Event name *</Label>
        <Input
          id="event_name"
          value={values.event_name}
          onChange={(event) => setField("event_name", event.target.value)}
          placeholder="e.g. Tech Fest 2026"
        />
        {errors.event_name && <p className="text-sm text-destructive">{errors.event_name}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={values.category} onValueChange={(value) => setField("category", value)}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="event_date">Event date *</Label>
          <Input
            id="event_date"
            type="date"
            value={values.event_date}
            onChange={(event) => setField("event_date", event.target.value)}
          />
          {errors.event_date && <p className="text-sm text-destructive">{errors.event_date}</p>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="venue">Venue *</Label>
          <Input
            id="venue"
            value={values.venue}
            onChange={(event) => setField("venue", event.target.value)}
            placeholder="e.g. Main Auditorium"
          />
          {errors.venue && <p className="text-sm text-destructive">{errors.venue}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_participants">Maximum participants *</Label>
          <Input
            id="max_participants"
            type="number"
            min={1}
            value={values.max_participants}
            onChange={(event) => setField("max_participants", event.target.value)}
            placeholder="e.g. 100"
          />
          {errors.max_participants && (
            <p className="text-sm text-destructive">{errors.max_participants}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={4}
          value={values.description}
          onChange={(event) => setField("description", event.target.value)}
          placeholder="Tell students what this event is about."
        />
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
