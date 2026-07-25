# Week 16 — Fix Floating Chat Button Hidden Behind Bottom Nav

## What was audited/built

Small, focused hotfix on `hotfix/chat-icon-z-index` (based on `dev`,
confirmed the subject-dedup/nav-fix PR (#65) was already merged).

Regression from the previous fix: `BottomNav` now renders via
`createPortal` directly to `document.body`, which changed its DOM
position relative to `FloatingChatWidget` (not portaled, rendered in its
normal tree position). Both used `z-50`. With equal z-index, two
`position: fixed` elements without an intervening stacking context
compare by DOM order — the portaled nav, now effectively later in
`document.body`'s children, rendered on top of the chat button.

## Fix

Bumped both `z-50` occurrences in
`components/student/FloatingChat/FloatingChatWidget.tsx` to `z-[60]`:
the launcher bubble, and the full-screen chat panel overlay shown when
open. The panel wasn't mentioned in the brief, but the same root cause
applies to it equally (also `fixed`, also coexists with the portaled
nav) — fixing only the bubble would have left the identical bug live on
the open panel's bottom edge (input box, send button), so both were
bumped together.

## Testing

Live-verified with Playwright at two viewport sizes (390×700 mobile,
1024×640 resized desktop):
- Computed `z-index`: button/panel `60`, nav `50` — confirmed via
  `getComputedStyle`.
- At the mobile width, the button and nav don't even spatially overlap
  (the button's `bottom-[...+80px]` offset already clears the nav's
  height) — so the reported bug wasn't visible there in the first place.
- At the resized desktop width, the button and nav rects **do** overlap
  (confirmed via bounding rects), and `document.elementFromPoint()` at
  the button's center now resolves to the button itself, not the nav —
  i.e. it's both visually on top and actually clickable, not just
  stacked correctly by coincidence.
- Chat panel opens/closes correctly and visually covers the nav while
  open (screenshot-confirmed).
- Nav still stays pinned to the true viewport bottom through a real
  scroll, and nav link navigation still works — confirming the previous
  fix (portal-to-body) is unaffected by this change.
- `npm run lint` and `npm run build` clean.

## Incident during verification (unrelated to the fix itself)

While verifying, ran a production `npm run build` against the same
`.next` directory a `next dev` process (the user's own, already running)
was actively using. `next build` and `next dev` don't share `.next`
state safely — the production build's output broke the live dev
server's module resolution (`Cannot find module './5873.js'`), turning
every page into a 500. Restored it by killing that dev server process
and starting a fresh `npm run dev` after clearing `.next`, which came
back up cleanly. Noting this here so it's not mistaken for a real
regression from the z-index change if seen again: **don't run `npm run
build` in the same working tree as a live `npm run dev` process** — use
a separate checkout/worktree, or make sure no dev server is running
first.
