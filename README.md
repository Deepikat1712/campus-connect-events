# College Event Registration System (Campus Events)

A full-stack CRUD web application where a college manages events and students register for them.

## Overview

Campus Events has two modules:

1. **Event Management** (admin / organizer) — create, view, update, delete, search and filter events.
2. **Student Registration** — browse events, view details, register, view all registrations, edit a
   registration and cancel it.

All data is stored in and read from a PostgreSQL database (Supabase). There is no dummy or static data.

## Problem statement

Colleges usually track events and student registrations on paper or spreadsheets. Seats get
oversold, duplicate entries appear, and nobody knows how many seats are left. This app centralises
events and registrations with validation and live seat counts.

## Objectives

- Provide a single place to publish college events.
- Let students register with validation and instant feedback.
- Prevent duplicate registrations and overbooked events.
- Demonstrate complete CRUD, search/filter, error handling and responsive design.

## Features

- Home dashboard with live stats: Total Events, Total Registrations, Upcoming Events, Available Events.
- Events page with search by name, filter by category and clear filters.
- Event details page with registered count and available seats.
- Add / Edit / Delete events (delete asks for confirmation).
- Registration form with student name, email, department and event.
- Registrations list (table on desktop, cards on mobile) with edit and cancel.
- Loading, empty and error states everywhere; friendly toast messages.
- Fully responsive: mobile, tablet, laptop, desktop.

## Technology stack

| Layer    | Technology                            |
| -------- | ------------------------------------- |
| Frontend | React 19 + TypeScript, TanStack Router |
| Styling  | Tailwind CSS v4 + shadcn/ui components |
| Data     | TanStack Query                         |
| Backend  | Supabase (PostgreSQL, REST data API)   |
| Icons    | lucide-react                           |

## System architecture

```text
React pages (src/routes)
        |  components (src/components)
        v
Data layer (src/lib/api.ts)  <-- validation (src/lib/validation.ts)
        v
Supabase JS client (src/integrations/supabase/client.ts)
        v
Supabase PostgreSQL: events, registrations (+ capacity trigger, RLS)
```

Pages never call the database directly — every query and mutation lives in `src/lib/api.ts`.

## Database design

### events

| Column           | Type        | Rules                                                     |
| ---------------- | ----------- | --------------------------------------------------------- |
| id               | uuid        | primary key, default gen_random_uuid()                    |
| event_name       | text        | required, non-empty                                       |
| category         | text        | required: Technical, Cultural, Sports, Workshop, Seminar, Other |
| event_date        | date        | required                                                  |
| venue            | text        | required, non-empty                                       |
| description      | text        | optional                                                  |
| max_participants | integer     | required, must be greater than 0                          |
| created_at       | timestamptz | default now()                                             |

### registrations

| Column        | Type        | Rules                                        |
| ------------- | ----------- | -------------------------------------------- |
| id            | uuid        | primary key, default gen_random_uuid()       |
| student_name  | text        | required, non-empty                          |
| email         | text        | required, must look like an email            |
| department    | text        | required, non-empty                          |
| event_id      | uuid        | required, foreign key -> events.id, on delete cascade |
| registered_at | timestamptz | default now()                                |

Relationship: one event has many registrations.

Constraints and rules enforced in the database:

- `UNIQUE (event_id, email)` — the same email cannot register twice for one event.
- `BEFORE INSERT` trigger `registrations_capacity_check` — blocks registration when the event is
  full and raises an error if the event does not exist.
- Row Level Security is enabled on both tables with policies for the app's anonymous access.

## CRUD operations

| Entity        | Create             | Read                         | Update                      | Delete                          |
| ------------- | ------------------ | ---------------------------- | --------------------------- | ------------------------------- |
| Events        | `/events/new`      | `/events`, `/events/:id`     | `/events/:id/edit`          | `/manage` (with confirmation)   |
| Registrations | `/events/:id/register` | `/registrations`         | `/registrations` edit dialog | `/registrations` (with confirmation) |

## Validation

Frontend (`src/lib/validation.ts`):

- "Event name is required" / "Event name must be at least 3 characters"
- "Category is required", "Event date is required", "Venue is required"
- "Maximum participants must be greater than 0"
- "Student name is required", "Please enter a valid email", "Department is required"
- "Please select an event"

Backend / friendly database messages (`src/lib/api.ts`):

- "This email is already registered for this event."
- "This event is full. No seats are available."
- "That event no longer exists. Please refresh and pick another event."
- "Could not reach the server. Please check your internet connection and try again."

## Installation and setup

```bash
git clone <your-repository-url>
cd <project-folder>
npm install
npm run dev
```

The app runs at `http://localhost:8080`.

### Supabase setup

If you create your own Supabase project, run this SQL in the SQL editor:

```sql
create table public.events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (length(trim(event_name)) > 0),
  category text not null check (category in ('Technical','Cultural','Sports','Workshop','Seminar','Other')),
  event_date date not null,
  venue text not null check (length(trim(venue)) > 0),
  description text,
  max_participants integer not null check (max_participants > 0),
  created_at timestamptz not null default now()
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  student_name text not null check (length(trim(student_name)) > 0),
  email text not null check (position('@' in email) > 1),
  department text not null check (length(trim(department)) > 0),
  event_id uuid not null references public.events(id) on delete cascade,
  registered_at timestamptz not null default now(),
  unique (event_id, email)
);

grant select, insert, update, delete on public.events to anon, authenticated;
grant select, insert, update, delete on public.registrations to anon, authenticated;

alter table public.events enable row level security;
alter table public.registrations enable row level security;

create policy "Anyone can view events" on public.events for select using (true);
create policy "Anyone can create events" on public.events for insert with check (true);
create policy "Anyone can update events" on public.events for update using (true) with check (true);
create policy "Anyone can delete events" on public.events for delete using (true);

create policy "Anyone can view registrations" on public.registrations for select using (true);
create policy "Anyone can create registrations" on public.registrations for insert with check (true);
create policy "Anyone can update registrations" on public.registrations for update using (true) with check (true);
create policy "Anyone can delete registrations" on public.registrations for delete using (true);

create or replace function public.check_event_capacity()
returns trigger language plpgsql security definer set search_path = public as $$
declare limit_count integer; current_count integer;
begin
  select max_participants into limit_count from public.events where id = new.event_id;
  if limit_count is null then raise exception 'Event does not exist'; end if;
  select count(*) into current_count from public.registrations where event_id = new.event_id;
  if current_count >= limit_count then raise exception 'This event is already full'; end if;
  return new;
end $$;

create trigger registrations_capacity_check
before insert on public.registrations
for each row execute function public.check_event_capacity();
```

### Environment variables

Sensitive configuration lives in environment variables, never in the source code:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Only the publishable (public) key is used in the browser. Service keys and passwords are never
placed in frontend code.

## How to run

| Command           | What it does                    |
| ----------------- | ------------------------------- |
| `npm run dev`     | start the development server    |
| `npm run build`   | create a production build       |

## Testing instructions

1. **Create** — go to Manage Events → Add Event, fill the form, submit. The event appears in the
   list and in the database.
2. **Read** — open Events; every event shows date, venue and available seats. Click View Details.
3. **Update** — Manage Events → Edit, change the venue, save; the new value is shown everywhere.
4. **Delete** — Manage Events → Delete; confirm in the dialog. The event and its registrations are removed.
5. **Register** — open an event → Register, fill the form; the registration appears in Registrations
   and the available seats decrease by one.
6. **Validation** — submit an empty event form (required-field messages), enter `abc` as email
   ("Please enter a valid email"), set participants to `0` ("Maximum participants must be greater
   than 0"), register the same email twice for one event ("This email is already registered for this
   event"), and fill an event to its limit to see the full-event message.

## Future enhancements

- Admin login so only organizers can manage events.
- Email confirmation after registration.
- Attendance marking and certificates.
- Export registrations to CSV / Excel.
- Event posters and image uploads.

## GitHub instructions

```bash
git init
git add .
git commit -m "College Event Registration System"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

Do not commit the `.env` file — keep keys in environment variables.
