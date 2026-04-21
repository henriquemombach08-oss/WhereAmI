# WhereAmI

WhereAmI is an Expo/React Native app that triggers alarms by destination proximity or by a fixed time. The project uses a small component/service split and stores favorite destinations in Supabase.

## Stack

- Expo SDK 54
- React Native 0.81
- `expo-location`, `expo-task-manager`, `expo-av`
- Supabase for favorites storage

## Project Structure

- `App.js`: app shell and screen composition
- `src/components/`: UI screens
- `src/hooks/`: theme and alarm state management
- `src/services/`: background task, alarm engine, and Supabase access
- `src/config/env.js`: runtime environment access

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local `.env` file based on `.env.example`.

Required variables:

```env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_DB_URL=...
```

3. Start the app:

```bash
npm start
```

Useful targets:

```bash
npm run android
npm run ios
npm run web
```

## Database

To create the `favorites` table, either:

- run `database_setup.sql` in the Supabase SQL Editor
- or execute:

```bash
node setup_db.js
```

`setup_db.js` expects `SUPABASE_DB_URL` in `.env` or the current shell environment.

Current policy model:

- anonymous read/insert is still enabled so the app works without auth
- table constraints now validate `name`, coordinates, and radius
- proper per-user privacy should be added when authentication is implemented

## Validation

Basic project validation used here:

```bash
npx expo config --json
npx expo-doctor
```
