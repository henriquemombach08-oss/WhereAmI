# Repository Guidelines

## Project Structure & Module Organization
`App.js` is the main Expo entry and wires navigation, alarms, and theme selection. Shared app code lives in `src/`: UI screens in `src/components/`, integrations and background logic in `src/services/`, and palette definitions in `src/theme.js`. Static assets are in `assets/`. Database helpers live at the repo root in `setup_db.js` and `database_setup.sql`. `zip_extract/` contains imported design references and should be treated as reference material, not runtime code.

## Build, Test, and Development Commands
Install dependencies with `npm install`. Start the Expo dev server with `npm start`. Use `npm run android`, `npm run ios`, or `npm run web` to launch the matching target from Expo. There is no dedicated build, lint, or automated test script in `package.json` yet, so validate changes by running the app locally on at least one target before opening a PR.

## Coding Style & Naming Conventions
Follow the existing JavaScript style: 2-space indentation is not used here; keep the current 2-space/4-space mix consistent within the file you touch and preserve semicolons. Prefer functional React components and hooks. Use `PascalCase` for screen/component files such as `MapScreen.js`, `camelCase` for functions and state, and `UPPER_SNAKE_CASE` for exported constants like `LOCATION_TASK_NAME`. Keep service modules focused on one integration or background concern.

## Testing Guidelines
Automated tests are not configured yet. Until a test runner is added, perform manual checks for the flows your change affects: permission prompts, map destination selection, alarm activation, background location behavior, and Supabase-backed favorites. When adding tests later, place them beside the related module as `*.test.js` or in a dedicated `__tests__/` folder.

## Commit & Pull Request Guidelines
Use short, imperative commit subjects, matching the existing history style (`Initial commit`). Example: `Add background alarm guard`. Keep commits scoped to one change. PRs should include a brief summary, steps to verify, linked issue if applicable, and screenshots or recordings for UI changes.

## Security & Configuration Tips
Do not add new secrets or service keys directly to tracked files. `src/services/supabase.js` currently contains project credentials; prefer moving future configuration to Expo environment settings or another non-committed secret source. Avoid committing generated local state from `.expo/` or other machine-specific artifacts.
