# Availability Calendar — Project Notes & Plan

## Description

A single‑view React app to define weekly availability in a chosen timezone. The UI shows seven columns (Mon–Sun) with 30‑minute rows, Google Calendar–style. Users select a start cell and an end cell to create a non‑overlapping availability range. Clicking an existing range deletes it. A timezone selector with quick search sits in the top‑right. Availabilities are stored canonically in UTC (anchored to a reference week) and are converted on the fly when the timezone changes. A list below the grid mirrors the current view in the selected timezone.

## Execution Plan

1. Time utilities: local↔UTC conversion with Intl; reference week.
2. State model: store ranges as `{startUtc,endUtc}` within the ref week.
3. UI shell: header + timezone search/selector (Tailwind + shadcn-style popover).
4. Grid: 7 columns × 48 rows (30-min); row labels hourly.
5. Selection: click start, click end → create range; validate 30m and no overlap; live preview while hovering end cell.
6. Rendering: map UTC ranges into per‑day segments in selected timezone.
7. Deletion: click a segment to confirm delete.
8. List view: below grid, show day + HH:MM–HH:MM in current timezone.
9. Polishing: basic accessibility roles, keyboard focus, minimal styles.

## Notes

- No overlaps allowed; ranges snap to 30 minutes.
- DST handled via iterative Intl-based conversion per slot; anchored to a fixed Monday in UTC to keep week alignment.
- Future enhancements: drag selection, resize handles, persistence (localStorage), and multi‑week templates.
- Styling uses Tailwind; `cn()` helper included for shadcn-style utilities; components can be migrated to full shadcn/ui if desired.
