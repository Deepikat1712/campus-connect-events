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

