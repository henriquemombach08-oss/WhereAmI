const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function readEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    return {};
  }

  return fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => !line.trim().startsWith('#'))
    .reduce((acc, line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) {
        return acc;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

const env = {
  ...readEnvFile(),
  ...process.env,
};

const connectionString = env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error('Missing SUPABASE_DB_URL. Add it to .env or export it before running setup_db.js.');
  process.exit(1);
}

const sql = `
CREATE TABLE IF NOT EXISTS favorites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  name text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  radius integer NOT NULL
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read" ON favorites;
CREATE POLICY "Allow public read" ON favorites
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON favorites;
CREATE POLICY "Allow public insert" ON favorites
  FOR INSERT WITH CHECK (true);
`;

const client = new Client({
  connectionString,
});

async function run() {
  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('Connected. Running SQL...');
    await client.query(sql);
    console.log('favorites table and policies created successfully.');
  } catch (err) {
    console.error('Failed to execute SQL:', err);
  } finally {
    await client.end();
  }
}

run();
