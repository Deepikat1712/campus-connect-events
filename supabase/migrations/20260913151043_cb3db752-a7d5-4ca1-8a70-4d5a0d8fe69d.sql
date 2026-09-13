CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL CHECK (length(trim(event_name)) > 0),
  category TEXT NOT NULL CHECK (category IN ('Technical','Cultural','Sports','Workshop','Seminar','Other')),
  event_date DATE NOT NULL,
  venue TEXT NOT NULL CHECK (length(trim(venue)) > 0),
  description TEXT,
  max_participants INTEGER NOT NULL CHECK (max_participants > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL CHECK (length(trim(student_name)) > 0),
  email TEXT NOT NULL CHECK (position('@' in email) > 1),
  department TEXT NOT NULL CHECK (length(trim(department)) > 0),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT registrations_unique_email_per_event UNIQUE (event_id, email)
);

CREATE INDEX idx_registrations_event_id ON public.registrations(event_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO anon, authenticated;
GRANT ALL ON public.events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO anon, authenticated;
GRANT ALL ON public.registrations TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events" ON public.events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create events" ON public.events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update events" ON public.events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete events" ON public.events FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Anyone can view registrations" ON public.registrations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create registrations" ON public.registrations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update registrations" ON public.registrations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete registrations" ON public.registrations FOR DELETE TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.check_event_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  limit_count INTEGER;
  current_count INTEGER;
BEGIN
  SELECT max_participants INTO limit_count FROM public.events WHERE id = NEW.event_id;
  IF limit_count IS NULL THEN
    RAISE EXCEPTION 'Event does not exist';
  END IF;
  SELECT count(*) INTO current_count FROM public.registrations WHERE event_id = NEW.event_id;
  IF current_count >= limit_count THEN
    RAISE EXCEPTION 'This event is already full';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER registrations_capacity_check
BEFORE INSERT ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.check_event_capacity();

INSERT INTO public.events (event_name, category, event_date, venue, description, max_participants) VALUES
('Tech Fest 2026', 'Technical', '2026-11-14', 'Main Auditorium', 'Annual technical festival with coding contests, robotics and project expo.', 250),
('Cultural Fest 2026', 'Cultural', '2026-12-05', 'Open Air Theatre', 'Music, dance and drama competitions across all departments.', 300),
('Web Development Workshop', 'Workshop', '2026-10-10', 'Computer Lab 3', 'Hands-on workshop on React, TypeScript and modern web tooling.', 60),
('AI & Machine Learning Seminar', 'Seminar', '2026-10-25', 'Seminar Hall B', 'Industry experts discuss practical applications of AI and ML.', 120),
('Inter College Sports Meet', 'Sports', '2026-11-28', 'College Sports Ground', 'Athletics, cricket, football and basketball tournaments.', 200);