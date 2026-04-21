-- Run this in the Supabase SQL Editor.
-- This keeps the current anonymous app working, but narrows the table shape and grants.
-- Per-user access control should be added once the app has authentication.

CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  name text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  radius integer NOT NULL,
  CONSTRAINT favorites_name_length CHECK (char_length(trim(name)) BETWEEN 1 AND 120),
  CONSTRAINT favorites_latitude_range CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT favorites_longitude_range CHECK (longitude BETWEEN -180 AND 180),
  CONSTRAINT favorites_radius_range CHECK (radius BETWEEN 25 AND 5000)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.favorites FROM PUBLIC;
GRANT SELECT, INSERT ON public.favorites TO anon, authenticated;

DROP POLICY IF EXISTS "Allow public read" ON public.favorites;
CREATE POLICY "Allow public read" ON public.favorites
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON public.favorites;
CREATE POLICY "Allow public insert" ON public.favorites
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(trim(name)) BETWEEN 1 AND 120
    AND latitude BETWEEN -90 AND 90
    AND longitude BETWEEN -180 AND 180
    AND radius BETWEEN 25 AND 5000
  );
