# Repository Guidelines

## Project Structure & Module Organization
- `src/` TypeScript Raycast extension code:
  - `record-transcription.tsx` (main UI), `transcription-history.tsx`, `view-logs.tsx`
  - `utils/ai/` (`doubao-client.ts`, `deepseek-client.ts`, `transcription.ts`)
  - `utils/` (`audio.ts`, `config.ts`, `logger.ts`, `history.ts`, `formatting.ts`, `prompt-manager.ts`, `programming-*.ts`)
  - `hooks/useAudioRecorder.ts`, `types.ts`, `constants.ts`
- `assets/` icons and static assets.
- `test-doubao-client.js` standalone Doubao connectivity test.
- Logs: view in “View Plugin Logs” or `/tmp/speech-to-text-debug.log` (debug mode).

## Build, Test, and Development Commands
- `npm install` — install dependencies.
- `npm run dev` — launch Raycast develop mode.
- `npm run dev:debug` — develop with detailed logs to `/tmp/speech-to-text-debug.log`.
- `npm run build` — build the extension (`ray build`).
- `npm run lint` / `npm run fix-lint` — run and auto-fix ESLint.
- `npm run publish` — publish to Raycast Store via `@raycast/api`.
- `node test-doubao-client.js` — quick Doubao API connectivity check.
Prereqs: macOS + Raycast installed, `ray` CLI in PATH, `brew install sox` for audio.

## Coding Style & Naming Conventions
- TypeScript strict mode; React with `.tsx`.
- ESLint: extends `@raycast` rules. Prettier: 2 spaces, width 100, double quotes, trailing commas (ES5), spaced brackets, `arrowParens: always`.
- Filenames: kebab-case (`record-transcription.tsx`).
- Components: PascalCase. Variables/functions: camelCase. Constants: UPPER_SNAKE_CASE.
- Prefer named exports; colocate helpers in `utils/*`.

## Testing Guidelines
- No formal unit-test suite yet; verify flows in `ray develop`.
- Add lightweight tests when useful: place in `tests/` or `__tests__/`, name `*.test.ts`.
- For API smoke checks use `node test-doubao-client.js`.

## Commit & Pull Request Guidelines
- Use Conventional Commits (English or Chinese): `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `style:`.
- PRs: include clear description, linked issues, and before/after screenshots or short GIFs of Raycast UIs when UI changes.
- Before requesting review: run `npm run lint` and `npm run build`; update docs when changing UX or configuration.

## Security & Configuration Tips
- Never commit API keys or credentials; store via Raycast Preferences. Use `node clear-credentials.js` to reset saved credentials.
- Avoid committing logs; `speech-to-text-debug.log` is ignored.
