# Calendar Convert — Availability Calendar 📅

Tired of converting timezones when discussing availabilities? Here's a solution!

A single‑view React app to define weekly availability in a selected timezone. The grid shows seven columns (Mon–Sun) with 30‑minute rows. Selections are stored in UTC and live‑convert to the chosen timezone. Mobile shows 1–3 days with horizontal scroll.

- Repo: https://github.com/synweap15/calendar-convert
- Stack: React + Vite, Tailwind (bright theme), shadcn‑style utilities, ESLint + Prettier, Vitest

## Features

- 7×48 grid (30‑minute slots), compact bright UI
- Timezone search with short label (e.g., CEST/PT)
- 12h/24h toggle; preview on hover while selecting
- Shareable URL: `?state=` Base64‑URL compact state (timezone + ranges)
- Custom modals for confirmations and alerts; accessible focus trap
- Mobile friendly: horizontal scroll + Prev/Next controls

## Quick Start

- nvm: `nvm install && nvm use`
- Install: `npm install`
- Dev: `npm run dev` (http://localhost:5173)
- Test: `npm test`
- Lint/Format: `npm run lint` / `npm run lint:fix` / `npm run format`

## Creator

- Paweł Werda — pawel@werda.pl — https://dev.werda.pl

## License

MIT License — see `LICENSE`.
