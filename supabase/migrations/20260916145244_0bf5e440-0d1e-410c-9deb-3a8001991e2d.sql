-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- One-time admin bootstrap: first signed-in user may claim admin
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'You must be signed in';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

-- Link registrations to an account when the student is signed in
ALTER TABLE public.registrations ADD COLUMN user_id uuid;

-- EVENTS: public read, admin-only writes
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
DROP POLICY IF EXISTS "Anyone can create events" ON public.events;
DROP POLICY IF EXISTS "Anyone can update events" ON public.events;
DROP POLICY IF EXISTS "Anyone can delete events" ON public.events;

CREATE POLICY "Public can view events"
  ON public.events FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can create events"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update events"
  ON public.events FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

REVOKE INSERT, UPDATE, DELETE ON public.events FROM anon;

-- REGISTRATIONS: no public reads, restricted inserts, admin-only edits
DROP POLICY IF EXISTS "Anyone can view registrations" ON public.registrations;
DROP POLICY IF EXISTS "Anyone can create registrations" ON public.registrations;
DROP POLICY IF EXISTS "Anyone can update registrations" ON public.registrations;
DROP POLICY IF EXISTS "Anyone can delete registrations" ON public.registrations;

CREATE POLICY "Admins can view all registrations"
  ON public.registrations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view their own registrations"
  ON public.registrations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

CREATE POLICY "Visitors can submit a registration"
  ON public.registrations FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Signed-in students can submit their own registration"
  ON public.registrations FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Admins can update registrations"
  ON public.registrations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete registrations"
  ON public.registrations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

REVOKE SELECT, UPDATE, DELETE ON public.registrations FROM anon;

-- Safe public aggregates (no student details exposed)
CREATE OR REPLACE FUNCTION public.event_registration_counts()
RETURNS TABLE (event_id uuid, registered_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, count(r.id)::integer
  FROM public.events e
  LEFT JOIN public.registrations r ON r.event_id = e.id
  GROUP BY e.id
$$;

REVOKE ALL ON FUNCTION public.event_registration_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.event_registration_counts() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.total_registrations()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM public.registrations
$$;

REVOKE ALL ON FUNCTION public.total_registrations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.total_registrations() TO anon, authenticated;