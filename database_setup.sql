-- Run this in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS favorites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  name text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  radius integer NOT NULL
);

-- Anonymous access is enabled until user auth is implemented.
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON favorites
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON favorites
  FOR INSERT WITH CHECK (true);
