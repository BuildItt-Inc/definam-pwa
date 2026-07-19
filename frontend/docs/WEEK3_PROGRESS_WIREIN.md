# WEEK3 — Progress Page Wire-in & Heatmap Rebuild

## What was done

Wired the progress page to the real backend and rebuilt the heatmap
component to match the actual 90-day API response and GitHub-style layout.

## Files changed

| File | Change |
|---|---|
| `frontend/lib/api/topics.ts` | `getProgressData()` now calls `GET /api/v1/student/progress` when `USE_MOCK=false`; mock path preserved |
| `frontend/app/(student)/student/progress/page.tsx` | `HeatmapSection` rebuilt for 90-day data with week alignment, hover/tap tooltip |

## Key decisions

**API call pattern** — matched the defensive unwrap from the recall-queue fix:
`Array.isArray` guards on `subject_mastery`, `upcoming_reviews`, `heatmap_data`;
`data` envelope unwrap; `urgency` string narrowed to the union type.

**Heatmap data shape** — backend returns exactly 90 entries, oldest-first
(`data[0]` = today - 89 days, `data[89]` = today), values clamped 0-4.
No re-mapping needed; `heatmap_data: number[]` in `ProgressData` is correct.

**Grid layout** — `gridAutoFlow: column` with 7 fixed rows (Sun row-0 ... Sat row-6).
`startDow = new Date(startMs).getDay()` determines how many empty leading cells
to prepend so column-0 rows align to the correct weekday.
Cell index mapping: `dataIdx = cellIdx - startDow` where `cellIdx = col*7 + row`.
Number of columns: `ceil((startDow + 90) / 7)` = 13 or 14 weeks depending on day.

**Tooltip** — `useState` tracks `{ date, count }`. `onMouseEnter`/`onMouseLeave`
for desktop hover; `onTouchStart` (with `e.preventDefault()`) toggles on mobile.
Info line below the grid shows `"DD Mon YYYY - N reviews"` or blank space.

**Colors** — kept the existing jade-family hex scale (`HEATMAP_COLORS`);
no new Tailwind classes needed since the palette has no shade scale for jade.

## Gaps / follow-ups

- The Next.js frontend-proxy route at `app/api/progress/[studentId]/route.ts`
  is still a scaffold stub — not used by the student-facing page (which calls
  the backend directly via `NEXT_PUBLIC_API_URL`).
- `avg_accuracy` is returned as a float (e.g. `71.5`) and displayed as `71.5%`;
  rounding to integer can be added to the fetch layer if needed.
