# Repository Guidelines

This guide explains how to develop, build, and contribute to the Raycast Speech‑to‑Text extension. It applies to the entire repository.

## Project Structure & Module Organization
- `src/` TypeScript Raycast extension code.
  - UI: `record-transcription.tsx`, `transcription-history.tsx`, `view-logs.tsx`
  - Utils: `utils/` (audio, config, logger, history, formatting, prompts, programming-*).
  - AI clients: `utils/ai/` (`doubao-client.ts`, `deepseek-client.ts`, `transcription.ts`)
  - Hooks: `hooks/useAudioRecorder.ts`
  - Shared: `types.ts`, `constants.ts`
- `assets/` icons and static assets.
- `test-doubao-client.js` Doubao API connectivity smoke test.
- Logs: Raycast “View Plugin Logs” or `/tmp/speech-to-text-debug.log` (debug mode).

## Build, Test, and Development Commands
- `npm install` install dependencies.
- `npm run dev` launch Raycast develop mode.
- `npm run dev:debug` develop with detailed logs to `/tmp/speech-to-text-debug.log`.
- `npm run build` build the extension (`ray build`).
- `npm run lint` / `npm run fix-lint` lint and auto-fix with ESLint.
- `npm run publish` publish via `@raycast/api` tooling.
- `node test-doubao-client.js` quick Doubao API connectivity check.
- Prereqs: macOS, Raycast installed, `ray` in PATH, `brew install sox` for audio.

## Coding Style & Naming Conventions
- TypeScript strict mode; React with `.tsx`.
- ESLint extends `@raycast` rules; Prettier: 2 spaces, width 100, double quotes, ES5 trailing commas, spaced brackets, `arrowParens: always`.
- Filenames: kebab-case (e.g., `record-transcription.tsx`).
- Components: PascalCase; variables/functions: camelCase; constants: UPPER_SNAKE_CASE.
- Prefer named exports; colocate helpers under `utils/*`.

## Testing Guidelines
- No formal suite yet; verify core flows in `ray develop`.
- Add lightweight tests when useful: place in `tests/` or `__tests__/`, name `*.test.ts`.
- For API smoke checks run `node test-doubao-client.js`.
- Include clear reproduction steps in PRs for bug fixes.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `style:`).
- PRs: concise description, linked issues, and before/after screenshots or short GIFs for UI changes.
- Before requesting review: `npm run lint` and `npm run build`; keep changes minimal and focused.
- Update docs when changing UX, configuration, or commands.

## Security & Configuration Tips
- Never commit API keys; store via Raycast Preferences.
- To reset saved credentials: `node clear-credentials.js`.
- Don’t commit logs; `speech-to-text-debug.log` is ignored.
- Validate third-party keys with the Doubao test before use.

