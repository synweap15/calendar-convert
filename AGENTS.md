# Repository Guidelines

This repo hosts a React-based availability calendar that renders weekly availability in a chosen timezone, with one column per weekday. Use this guide to develop, test, and contribute consistently.

## Project Structure & Module Organization

- `src/`: Application source.
  - `components/`: UI components (e.g., `AvailabilityCalendar.jsx`).
  - `components/ui/`: (optional) shadcn-style UI wrappers.
  - `lib/`: Small helpers (time, formatting, constants). Includes `utils.js` with `cn()`.
  - `App.jsx`, `main.jsx`, `index.css`: App entry and styles.
- `index.html`: Vite HTML entry.
- `tests/` or `src/**.test.jsx`: Unit tests colocated or in `tests/`.
- `vite.config.js`, `package.json`: Tooling and scripts.

## Build, Test, and Development Commands

- nvm: `nvm install && nvm use` (uses `.nvmrc` with latest Node).
- `npm install`: Install dependencies.
- `npm run dev`: Start local dev server at `http://localhost:5173`.
- `npm run build`: Production build to `dist/`.
- `npm run preview`: Serve the built app locally.
- `npm test`: Run unit tests (Vitest + jsdom).
- `npm run lint` / `npm run lint:fix`: Lint and auto-fix (ESLint with curly=all, arrow-body-style=always; Prettier integrated).
- `npm run format` / `npm run format:check`: Format with Prettier.
- Pre-commit: Husky runs `npm run lint:fix` and re-stages changes.
- CI: GitHub Actions runs format check, lint, tests, and build.

## Coding Style & Naming Conventions

- Indent 2 spaces; semicolons required; single quotes preferred.
- Always use braces for all blocks and arrows: no brace-less code. Use block-bodied arrows with explicit `return`.
- React components: PascalCase (`AvailabilityCalendar`); hooks/utilities: camelCase.
- Files: components `*.jsx`, hooks `use*.js`, helpers in `lib/`.
- Formatting: Prettier recommended; linting with ESLint (React rules). Keep components small and pure where possible.
- Tailwind: prefer utility-first classes; use `cn()` to merge classes (shadcn-style).

## Testing Guidelines

- Framework: Vitest with `@testing-library/react` and `jsdom`.
- Place tests as `*.test.jsx` next to code or under `tests/` mirroring paths.
- Cover: parsing, timezone handling, and rendering of weekday columns. Aim for meaningful tests over raw coverage.
- Run: `npm test` (watch mode with `-w`).

## Commit & Pull Request Guidelines

- Commits: Present tense, concise scope-first subject (e.g., `feat(calendar): add timezone selector`).
- PRs: Clear description, linked issue, reproduction steps, and screenshots/GIFs for UI changes.
- Include notes on timezone assumptions and edge cases (DST boundaries, overlapping ranges).

## Security & Configuration Tips

- Do not commit secrets; use environment variables when needed.
- Keep date/time logic centralized in `lib/` to avoid drift across components.
