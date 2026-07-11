# Week 4 — Design Token Audit

## What was audited

Every file under:
- `app/(auth)/`
- `app/(student)/`
- `app/(admin)/`
- `app/page.tsx`
- `components/landing/`
- `components/student/`
- `components/admin/`

Checked against the 5 approved tokens (`ink`, `cream`, `jade`, `gold`, `coral`) and their established tints defined in `tailwind.config.ts`.

---

## Files changed

### Token drift fix (wrong hex → exact token)

| File | Change |
|---|---|
| `app/(auth)/mobile/page.tsx` | `fill="#24A06E"` → `fill="#5DCAA5"` (jade-light) in inline logo SVG — was drifted from `LogoMark.tsx` which uses the correct `#5DCAA5` |

### Inline hex → Tailwind token class (consistency pass)

| File | Change |
|---|---|
| `app/(auth)/mobile/code/page.tsx` | `bg-[#EAF3DE]` → `bg-jade-tint` (×2); `text-[#085041]` → `text-jade-dark` (×2) |
| `app/(auth)/pay/callback/page.tsx` | `bg-[#EAF3DE]` → `bg-jade-tint` (×2); `text-[#085041]` → `text-jade-dark` (×4) |
| `app/(auth)/pay/individual/page.tsx` | `bg-[#EAF3DE]` → `bg-jade-tint`; `text-[#085041]` → `text-jade-dark` |
| `app/(auth)/pay/organisation/page.tsx` | `bg-[#EAF3DE]` → `bg-jade-tint` (×2); `text-[#085041]` → `text-jade-dark` (×3) |
| `app/(auth)/register/page.tsx` | `bg-[#EAF3DE]` → `bg-jade-tint`; `text-[#085041]` → `text-jade-dark` |
| `app/(admin)/admin/page.tsx` | `bg-[#FEF3C7]` → `bg-gold-tint` in AI alert bar |
| `app/(admin)/admin/ids/page.tsx` | `bg-[#EAF3DE]` → `bg-jade-tint` (×2); `bg-[#FEF3C7]` → `bg-gold-tint` |
| `components/admin/ClassTable.tsx` | `hover:bg-[#EAF3DE]` → `hover:bg-jade-tint` on student rows |
| `components/admin/IdManagementTable.tsx` | `hover:bg-[#EAF3DE]` → `hover:bg-jade-tint` on code rows |

---

## Files with NO issues

- `app/(auth)/activate/page.tsx` — scaffold only
- `app/(auth)/admin/login/page.tsx` — all token classes used correctly
- `app/(auth)/login/page.tsx` — clean
- `app/(student)/layout.tsx` — no color
- `app/(student)/student/page.tsx` — uses token classes throughout
- `app/(student)/student/learn/page.tsx` — clean
- `app/(student)/student/learn/[topicId]/page.tsx` — clean
- `app/(student)/student/progress/page.tsx` — uses token classes (heatmap uses documented data-viz colors)
- `app/(student)/student/recall/page.tsx` — clean
- `app/(student)/student/recall/session/page.tsx` — clean
- `app/(student)/student/chat/page.tsx` — scaffold only
- `app/(admin)/layout.tsx` — no color
- `app/(admin)/admin/reports/page.tsx` — scaffold only
- `app/(admin)/admin/students/[studentId]/page.tsx` — clean
- `components/landing/LogoMark.tsx` — uses `bg-jade` class + correct `#5DCAA5` SVG fill
- `components/landing/MobileNav.tsx` — clean
- `components/landing/PatternGlyphs.tsx` — renders caller-supplied color strings (no hardcoding)
- `components/student/BottomNav.tsx` — uses `text-jade`, `bg-jade` token classes
- `components/student/RecallCard.tsx` — clean
- `components/student/SubjectCard.tsx` — clean
- `components/student/TopicListItem.tsx` — clean
- `components/student/LearningStep.tsx` — clean
- `components/student/PracticeQuestion.tsx` — uses `border-jade/bg-jade` and `border-coral/bg-coral` token classes
- `components/student/QualityRating.tsx` — uses `bg-jade` token class
- `components/student/ChatMessage.tsx` — scaffold only
- `components/admin/StudentDetail.tsx` — uses `bg-jade`, `text-jade`, `bg-gold`, `bg-coral` token classes; flagged values noted below
- `components/admin/ProgressChart.tsx` — scaffold only
- `components/admin/WeakTopicsPanel.tsx` — scaffold only

---

## Genuinely new colors — flagged, NOT changed

These do not map to any of the 5 tokens or their established tints. They need a product/design decision before becoming tokens or being replaced.

| Hex / Class | Where used | Description |
|---|---|---|
| `#9FE1CB` | `mobile/code`, `pay/callback`, `pay/individual`, `pay/organisation`, `register`, `admin/ids`, landing heatmap, progress heatmap | Border color for jade-tint info cards and heatmap mid-step. Sits between `jade-light` (#5DCAA5) and `jade-tint` (#EAF3DE) in lightness. Candidate token name: `jade-border` |
| `#0F6E56` | `mobile/code`, `pay/callback`, `pay/individual`, `pay/organisation`, `register` | Descriptive body text inside jade-tint info cards. Sits between `jade` (#1B6B4A) and `jade-light` (#5DCAA5). Candidate: `jade-mid` |
| `#633806` | `admin/page.tsx` | Text color in gold-tint AI alert bar. Sits between `gold-dark` (#854F0B) and `gold-darker` (#412402). Candidate: `gold-text` |
| `#E5C97A` | `admin/ids/page.tsx` | Border for unused-stat gold-tint card. Lighter gold border, not a current token. Candidate: `gold-border` |
| `#555` / `#555555` | `app/page.tsx` (subject pills text), `components/admin/StudentDetail.tsx` (overdue/not-started status pills) | Medium neutral gray. Not close enough to any of the 5 tokens to replace. Neutral gray token or replace with `text-gray-500` convention. |
| `#F0F0F0` | `components/admin/AdminSidebar.tsx` | Sidebar panel background. Light neutral gray. Not a project token. Candidate: add a `surface` or `panel` neutral to the config, or replace with `bg-gray-100`. |
| `#E0DDD8` | `app/page.tsx` (subject pill borders) | Warm light-gray border. Closer to `cream` (#F5F0E8) but darker. Not a token. |
| `border-amber-200` / `hover:bg-amber-100` | `app/(admin)/admin/page.tsx` (AI alert bar) | Tailwind amber defaults used instead of a project gold tint. Should either become `border-gold/20` (opacity modifier) or a gold tint token. |
| `#EEEEEE` | `app/(student)/student/progress/page.tsx`, `app/page.tsx` landing heatmap | Neutral gray used for zero-activity heatmap cells. This is intentional data-viz empty state — not a brand color. Consider documenting as a data-viz constant rather than a design token. |

---

## Inline-style hex that is correct but structurally locked

These use the exact right token value in a `style={}` prop where a Tailwind utility class cannot easily express `border-top`/`border-left` shorthand with a dynamic width. No change made; values are consistent.

| Location | Value | Token it matches |
|---|---|---|
| `app/(admin)/admin/page.tsx` — `StatCard` `topBorderColor` prop | `#1B6B4A`, `#C8973A`, `#E85D3A` | `jade`, `gold`, `coral` (exact) |
| `app/(admin)/admin/ids/page.tsx` subscription banner `borderLeft` | `#1B6B4A` | `jade` (exact) |
| `app/(admin)/admin/page.tsx` alert bar `borderLeft` | `#C8973A` | `gold` (exact) |
| `app/page.tsx` OrbitIllustration SVG fills | `#1B6B4A`, `#C8973A`, `#E85D3A`, `#5DCAA5`, `#0F3D2C` | All exact token/tint values — SVG attributes cannot use Tailwind classes |

---

## Follow-ups

1. Add `#9FE1CB`, `#0F6E56`, `#633806`, `#E5C97A` as named tokens to `tailwind.config.ts` if the design confirms them (suggested names above), so all info-card patterns can switch to token classes.
2. Decide whether `#555555`/`#F0F0F0`/`#E0DDD8` should be project tokens or replaced with the nearest Tailwind gray default.
3. Replace `border-amber-200`/`hover:bg-amber-100` in the AI alert bar with gold-based token classes once `#E5C97A` is confirmed.
4. Consider extracting the jade-tint info card into a shared `<InfoCard>` component — it appears 6× across auth screens with the same `bg-jade-tint border border-[#9FE1CB]` pattern.
