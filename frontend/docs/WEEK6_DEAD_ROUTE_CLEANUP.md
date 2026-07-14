# Week 6 — Dead Route Cleanup

## What was done

Removed three dead routes and one broken link from the frontend on branch `fix/dead-routes-and-settings`.

## Files removed

| Path | Reason |
|---|---|
| `app/auth/code-entry/page.tsx` | Auth bypass stub — accepted any non-empty input and pushed straight to `/student` with no API call. Real org login lives at `/(auth)/mobile/code`. |
| `app/(auth)/activate/page.tsx` | One-line scaffold (`<main>Student ID activation page scaffold</main>`) not wired into any flow. |

## Files changed

| Path | Change |
|---|---|
| `app/(auth)/login/page.tsx` | Removed "Forgot password?" link (`href="/forgot-password"`). No such page exists; it 404s and triggers a prefetch 404 on every login page load. |

## Pre-deletion checks

Grepped the entire `frontend/` source tree for links to `/auth/code-entry` and `/activate` — no live references found in source code (only in `tsconfig.tsbuildinfo` build artifact and `docs/WEEK4_DESIGN_TOKEN_AUDIT.md`). No re-pointing required.

## Verification

- `npm run type-check` — clean
- `npm run lint` — clean (no ESLint warnings or errors)

## Gaps / follow-ups

- The `mb-7` bottom margin that the forgot-password div provided is now gone. The spacing between the password field and the error banner is tighter. If the design needs breathing room there, add `mb-7` directly to the password field's closing `</div>` or the error banner.
- `/(auth)/mobile/code` (the real org login) should be audited separately to confirm it calls the correct API endpoint before being linked from any onboarding flow.
