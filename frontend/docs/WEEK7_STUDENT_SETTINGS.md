# WEEK 7 — Student Settings Page

## What was built

A role-aware settings screen at `/student/settings` for both individual and org students.

## Files changed

| File | Change |
|------|--------|
| `frontend/types/auth.ts` | Added `UserMe` interface (`id`, `username`, `role`, `org_id`) |
| `frontend/lib/api/auth.ts` | Added `getMe()` — calls `GET /api/v1/auth/me` via `getAuthHeaders()` |
| `frontend/app/(student)/student/settings/page.tsx` | Created — new settings page |

## Template used

`frontend/app/(student)/student/progress/page.tsx` — matched its skeleton/error/appbar/main/BottomNav structure exactly.

## Role and org_id source

`GET /api/v1/auth/me` → `{ id, username, role, org_id }`. Role values in the DB are `student_individual | student_org | admin` (confirmed in `backend/app/db/models.py`). The new `getMe()` call runs in parallel with `getHomeData()` on page mount.

## School name source

`getHomeData()` (`GET /api/v1/students/dashboard`) — same endpoint the home page uses. The backend returns `school_name or "Independent Learner"` so individual students always get that fallback string. The settings page uses it as the subtitle for org students only.

## Gaps / stubs

- **Name update endpoint does not exist.** `handleSaveName` closes the edit field and logs a TODO but makes no API call. The UI (inline Pencil → input → Check/X) is fully built; wiring up requires a new backend endpoint (e.g. `PATCH /api/v1/students/me`).
- **`ChangePasswordRequest` has no `old_password` field.** The backend schema (`app/schemas/auth.py`) only accepts `{ new_password, confirm_password }`. The form matches the actual contract — two fields, not three.

## What each role sees

| Section | Individual | Org |
|---------|-----------|-----|
| Heading "Settings" | ✓ | ✓ |
| Display name (editable, stubbed) | ✓ | ✓ |
| Subtitle | "Independent Learner" | School name |
| Change Password | ✓ | — |
| Log Out | ✓ | ✓ |
| App version | ✓ | ✓ |
