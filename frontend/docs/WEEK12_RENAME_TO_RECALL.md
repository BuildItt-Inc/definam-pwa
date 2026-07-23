# Week 12 — Currency Bug Fix + Rename to Recall

## What was audited/built

Two independent fixes on `feature/rename-to-recall` (branched from `dev`):

1. **Part 1** — `frontend/app/(auth)/pay/organisation/page.tsx` had genuine
   byte-level UTF-8 mojibake (real corrupted bytes on disk, not a display
   artifact): the naira symbol, box-drawing comment separators, an em dash,
   an ellipsis, and a multiplication sign were all mangled.
2. **Part 2** — renamed the product from "DefinAm" to "Recall" across every
   user-facing surface in the frontend and backend, and resolved the
   resulting name collision with the existing "Recall" (spaced-repetition)
   bottom-nav feature by relabeling that feature "Review".

## Part 1 — mojibake root cause and fix

The corruption pattern was a classic double-encode: real UTF-8 bytes were
at some point read as CP1252 and re-saved as UTF-8, turning e.g. `₦`
(`E2 82 A6`) into the 3-character sequence `â‚¦`. Confirmed via CP1252-only
codepoints in the corrupted text (U+201A, U+201D) — rules out plain Latin-1
corruption. Reversed with `text.encode('cp1252').decode('utf-8')`.

Two `×` (multiplication sign) spots didn't reverse cleanly — they'd
previously been hand-mangled into a different, non-double-encoded shape
(`Ã` followed by literal `-`, not a clean 5-byte double-encode). Those two
spots were fixed by direct replacement rather than the programmatic
round-trip.

**File changed:** `frontend/app/(auth)/pay/organisation/page.tsx` (14 lines) —
`formatNaira()`'s `₦`, the `×` in the live price-preview string, an em dash
in a comment and in the price string, an ellipsis in "Redirecting…", and
seven box-drawing comment separators. No other file in the repo had this
corruption pattern.

**Verified:**
- No UTF-8 BOM in the file.
- No remaining out-of-range Latin-1 characters outside the intended `₦×—…`.
- Live in a browser at `/pay/organisation`: naira symbol and multiplication
  sign both render correctly in the price-preview line
  (`— students × ₦1,700/term`).

**Pre-existing, out-of-scope bug noticed during live verification:** the
price-preview line's *dynamic* part (`{displayCount} students`) doesn't
update when a real user types into the "Number of Students" field — it
stays at the `—` placeholder even though the input's value visibly updates.
Confirmed via `git diff dev` that this logic (`watch('student_count')` /
`parsedCount` / `displayCount`) is completely untouched by this branch —
this bug already exists on `dev` and is unrelated to the mojibake fix.
Flagging for a separate fix; not addressed here since it's outside this
task's scope (mojibake corruption only).

## Part 2 — DefinAm → Recall rename

**Policy applied:** rename what a user or visitor actually sees or reads
(page titles, metadata, on-screen copy, email subject lines/bodies, PDF/CSV
filenames a user downloads). Leave alone anything that's real
infrastructure: the `definam.ng` domain and email addresses, the GitHub
repo name (`definam-pwa`), `package.json`/`pyproject.toml` package names,
env var names/defaults, DB names, and internal code identifiers.

### Frontend (renamed)

| File | What changed |
|---|---|
| `app/page.tsx` | Metadata `title`/`description`/`appleWebApp.title`/`openGraph.title`+`siteName`; header/footer logo text; hero copy; footer copyright |
| `app/layout.tsx` | `title: 'Recall PWA'` |
| `components/admin/AdminSidebar.tsx` | Sidebar logo text |
| `lib/utils/constants.ts` | `APP_NAME` |
| `public/manifest.json` | `name`/`short_name` (PWA install prompt) |
| `components/landing/MobileNav.tsx` | Nav logo text |
| `app/(auth)/mobile/page.tsx` | Metadata title + `<h1>` wordmark |
| `app/(auth)/mobile/code/page.tsx` | "Enter Recall" / "your Recall login forever" |
| `app/(auth)/admin/login/page.tsx` | "your Recall admin dashboard" |
| `app/(auth)/login/page.tsx` | Header logo, footer copyright |
| `app/(auth)/register/page.tsx` | Header logo, "a Recall subscription", footer copyright |
| `lib/api/admin.ts` | CSV download filenames: `recall-codes-*.csv` |

### Backend (renamed)

| File | What changed |
|---|---|
| `app/main.py` | FastAPI `title="Recall API"`, `description` (drives `/api/docs`) |
| `app/core/email.py` | 3 email subject lines; access-code CSV attachment filename `recall_access_codes.csv` |
| `app/services/webhook_service.py` | 2 payment-notification subject lines |
| `app/services/chat.py` | AI tutor system prompt ("...Socratic Nigerian tutor for Recall.") |
| `app/api/v1/endpoints/auth.py` | Password reset email subject (also fixed a pre-existing "Definam" typo) |
| `app/templates/emails/individual_code.html` | `<title>`, `<h1>`, body copy |
| `app/templates/emails/org_admin_credentials.html` | `<title>`, `<h1>`, `<code>` filename reference |
| `app/templates/emails/payment_receipt.html` | `<title>`, footer |

### Intentionally left as "DefinAm" / `definam` (infra, not user text)

- `https://definam.ng` — the real domain, linked from emails and
  `openGraph.url`. Not renamed; that would break a live link.
- `support@definam.ng` (mailto link on the payment callback page) and
  `FROM_EMAIL`/`.env.example` — real email addresses.
- `package.json`/`package-lock.json` `"name": "definam-pwa"`, backend
  `pyproject.toml`/`uv.lock` package name+description — package
  identifiers, not shown to end users.
- GitHub repo name (`definam-pwa`) — explicitly out of scope per the brief;
  a separate decision.
- `.env.example` `DATABASE_URL` db name, `app/core/config.py`'s
  `from_email` default — internal config, not user-facing.
- `README.md`, `app/db/models.py` docstring, `app/core/exceptions.py`
  comment — developer-facing text, not user-facing.
- All `backend/tests/*.py` scripts (`create_test_user.py`, `chaos_test.py`,
  `smoke_test.py`, `test_webhooks.py`, `create_pilot_admins.py`,
  `locustfile.py`) and `scripts/*.py` — dev tooling, console output only.
- `frontend/lib/api/mock/data.ts` — has its own unrelated pre-existing
  mojibake in a code comment; out of scope for this task, not touched.

Confirmed via a final case-insensitive grep sweep of both `frontend/` and
`backend/` (excluding the categories above) that no remaining user-facing
"DefinAm"/"definam" string exists.

## Recall vs. Review naming collision

The new app name "Recall" collided with the existing spaced-repetition
review feature, which was also called "Recall" throughout the student UI
(bottom-nav tab, page headings, admin dashboard columns, push
notifications). Resolved by relabeling **only the user-visible text** for
that feature to "Review", everywhere it appears:

- `components/student/BottomNav.tsx` — tab label `'Review'`
  (`recallCount` prop name kept — internal)
- `app/(student)/student/page.tsx` — router push target updated to match
  the route rename below
- `components/student/RecallCard.tsx` — "Daily Recall" → "Daily Review"
  (component/prop names kept — internal)
- `app/(student)/student/review/page.tsx` and `.../review/session/page.tsx`
  — `<h1>`/`<p>` headings → "Daily Review"
- `components/admin/ClassTable.tsx`, `app/(admin)/admin/page.tsx` — table
  column header and stat-card label → "Review Status" / "Review Overdue"
- `backend/app/services/push.py` — push notification heading →
  "📚 Daily Review Reminder"

**Route path:** also renamed `/student/recall` → `/student/review`
(`git mv` on the directory, plus every `router.push`/`router.replace`
reference updated). The brief explicitly delegated this weighing —
bookmark/link breakage risk vs. label/URL consistency — rather than
treating it as a separate product decision. Chose to rename: this is a
student-only in-app tab with no external inbound links or marketing
references to the old path (unlike e.g. a public landing page URL), so the
breakage risk is minimal and confined to users who happen to have the old
URL bookmarked, who will hit a normal 404 rather than a silent failure.

**Deliberately NOT renamed** (backend/internal identifiers — brief said not
to rename these "unless there's a compelling reason," and none was found):
`DailyRecallQueue` DB model/table and all its usages, `TopicReview` model,
frontend types (`RecallItem`, `RecallQueueItem`, `RecallStatus`,
`RecallSubmitResult`), frontend functions (`getRecallQueue`,
`submitRecallRating`, `useRecall`), components (`RecallCard`, `RecallBadge`,
`RecallSkeleton`), the `sessionStorage` key `'recall_queue'`, and the
scaffold-only Next.js API route stubs under `app/api/recall/*` and
`app/api/cron/recall-queue/*` (placeholder JSON responses, not real pages).

## Verification

- `npm run lint`, `npm run type-check`, `npm run build` — all clean.
- `uv run pytest` — 46 passed, 1 skipped. `ruff` clean.
- Live browser check (Playwright against local dev servers):
  - Landing page `<title>`: "Recall — Study smarter for WAEC, NECO and
    JAMB"; `og:title` / `og:site_name`: "Recall"; `manifest.json`
    `name`/`short_name`: "Recall".
  - `/api/openapi.json`: `title: "Recall API"`,
    `description: "Backend API for the Recall learning platform"`.
  - Logged in as `teststudent`: bottom nav shows "Review" (not "Recall"),
    clicking it navigates to `/student/review` and renders the "Daily
    Review" heading and empty/queue state correctly.
  - `/pay/organisation`: naira symbol and multiplication sign render
    correctly (see Part 1).

## Gaps / follow-ups

- The pre-existing `/pay/organisation` live-price-preview reactivity bug
  noted in Part 1 (not caused by this branch, not fixed here).
- GitHub repo name, deployment project names, and other real infrastructure
  identifiers remain "definam" — a separate decision, out of scope here.
