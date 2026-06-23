# Week 2 F1 — Student App Screens

**Branch:** `feature/week2-f1-student-screens`  
**Date:** June 2026  
**Status:** Mock layer complete. Real API endpoints not connected (`USE_MOCK = true`).

---

## 1. Overview

This week delivered the complete student-facing UI for DefinAm's PWA: home dashboard, subject/chapter/topic browsing, a five-step learning flow with WAEC-aligned practice questions, the SM-2 daily recall flow, and a progress tracking screen. All screens run against a local mock layer — no backend calls are made. Switching to real endpoints requires a single boolean change.

The student app lives at `app/(student)/student/` under the Next.js 15 App Router. All pages are `'use client'` components. The layout wrapper at `app/(student)/layout.tsx` is intentionally minimal (`<section>{children}</section>`) — desktop max-width centering is deferred to a later week.

---

## 2. Screens Built

| Screen ID | Route | File path | Description | Status |
|---|---|---|---|---|
| SCR-04a | `/student` | `app/(student)/student/page.tsx` | Home Dashboard — recall queue present; shows "Time to Review" card + recent topics + subject filter pills | ✅ Complete |
| SCR-04b | `/student` | `app/(student)/student/page.tsx` | Home Dashboard — empty recall queue; shows "Start here" topic list | ✅ Complete |
| SCR-05a | `/student/learn` | `app/(student)/student/learn/page.tsx` | Browse — subjects list with search | ✅ Complete |
| SCR-05b | `/student/learn/[subjectId]?view=chapters` | `app/(student)/student/learn/[topicId]/page.tsx` | Browse — chapters list for a subject | ✅ Complete |
| SCR-05c | `/student/learn/[subjectId]?view=topics&chapterId=X` | `app/(student)/student/learn/[topicId]/page.tsx` | Browse — topics list for a chapter | ✅ Complete |
| SCR-06a | `/student/learn/[topicId]` (step 1) | `app/(student)/student/learn/[topicId]/page.tsx` | Learning flow — Simple Definition | ✅ Complete |
| SCR-06b | `/student/learn/[topicId]` (step 2) | `app/(student)/student/learn/[topicId]/page.tsx` | Learning flow — Nigerian Example | ✅ Complete |
| SCR-06c | `/student/learn/[topicId]` (step 3) | `app/(student)/student/learn/[topicId]/page.tsx` | Learning flow — Visual Breakdown (text diagram) | ✅ Complete |
| SCR-06d | `/student/learn/[topicId]` (step 4) | `app/(student)/student/learn/[topicId]/page.tsx` | Learning flow — Practice Questions (MCQ) + score summary | ✅ Complete |
| SCR-06e | `/student/learn/[topicId]` (step 5) | `app/(student)/student/learn/[topicId]/page.tsx` | Learning flow — AI Tutor (scaffolded; chat input disabled) | ⚠️ Scaffold |
| SCR-07a | `/student/recall` | `app/(student)/student/recall/page.tsx` | Daily Recall — queue overview; two states (items due / all caught up) | ✅ Complete |
| SCR-07b | `/student/recall/session` | `app/(student)/student/recall/session/page.tsx` | Recall session — question card, answer hidden | ✅ Complete |
| SCR-07c | `/student/recall/session` | `app/(student)/student/recall/session/page.tsx` | Recall session — answer revealed, model answer card, 0–5 rating | ✅ Complete |
| SCR-07d | `/student/recall/session` | `app/(student)/student/recall/session/page.tsx` | Recall session — completion screen with streak + next reviews | ✅ Complete |
| SCR-08 | `/student/chat` | `app/(student)/student/chat/page.tsx` | AI Tutor Chat (standalone route) | ⚠️ Scaffold |
| SCR-09 | `/student/progress` | `app/(student)/student/progress/page.tsx` | My Progress — stat cards, subject mastery, heatmap, upcoming reviews | ✅ Complete |

---

## 3. File Structure

```
frontend/
├── app/
│   └── (student)/
│       ├── layout.tsx                        # Bare section wrapper — desktop layout deferred
│       └── student/
│           ├── page.tsx                      # SCR-04 Home Dashboard
│           ├── learn/
│           │   ├── page.tsx                  # SCR-05a Subjects list
│           │   └── [topicId]/
│           │       └── page.tsx              # SCR-05b/c Browse + SCR-06a-e Learning flow
│           ├── recall/
│           │   ├── page.tsx                  # SCR-07a Recall queue overview
│           │   └── session/
│           │       └── page.tsx              # SCR-07b/c/d Recall session
│           ├── progress/
│           │   └── page.tsx                  # SCR-09 My Progress
│           ├── chat/
│           │   └── page.tsx                  # SCR-08 scaffold only
│           └── settings/                     # Not built this week
│
├── components/
│   └── student/
│       ├── BottomNav.tsx                     # Shared 5-tab bottom navigation
│       ├── RecallCard.tsx                    # Home screen recall card (2 states)
│       ├── SubjectCard.tsx                   # Subject row in browse list
│       ├── TopicListItem.tsx                 # Topic row with study status badge
│       ├── LearningStep.tsx                  # Steps 1/2/3 content renderer
│       ├── PracticeQuestion.tsx              # MCQ question with reveal + feedback
│       └── QualityRating.tsx                 # SM-2 0–5 recall quality rating grid
│
├── lib/
│   └── api/
│       ├── topics.ts                         # All student API functions
│       └── mock/
│           ├── week2.ts                      # USE_MOCK toggle + MOCK_DELAY_MS
│           └── data.ts                       # All mock data exports
│
├── types/
│   └── topics.ts                             # All TypeScript interfaces for student domain
│
└── docs/
    └── wireframes/
        └── week2-f1-screens-spec.html        # Source-of-truth wireframe (read-only)
```

---

## 4. Student App Flows

### 4.1 Home → Recall Flow

1. Student lands on `/student`. `getHomeData()` is called; a skeleton renders while it fetches (400 ms in mock).
2. The page checks `recall_queue.length`:
   - **Queue present (SCR-04a):** `RecallCard` shows a jade-bordered card with topic names and a "Start Recall Session" button. Below it, recent topics are listed with mastery mini-bars.
   - **Queue empty (SCR-04b):** `RecallCard` shows a dashed empty state. Recent topics appear under "Start here" with jade "Start →" badges.
3. Tapping the recall card → `router.push('/student/recall')`. Tapping BottomNav "Recall" tab has the same effect.
4. `/student/recall` calls `getRecallQueue()`. If items are due, a jade info card shows the count and a time estimate (`queue.length × 2.5 min`, ceiling). Tapping **"Start All Reviews →"** serialises the `RecallItem[]` to `sessionStorage["recall_queue"]` and navigates to `/student/recall/session`.
5. The session page reads from `sessionStorage` on mount. If it is missing or empty, it redirects back to `/student/recall` immediately.
6. The session steps through each item: question card (SCR-07b) → reveal answer → `QualityRating` (SCR-07c) → next item. After the last item the completion screen (SCR-07d) shows the session count, elapsed time, and incremented streak.
7. From SCR-07d, the student can navigate to Browse or Home.

### 4.2 Browse → Learn Flow

1. **Subjects (SCR-05a):** `/student/learn` calls `getSubjects()`. A live search input filters the list client-side. Tapping a subject navigates to `/student/learn/[subjectId]?view=chapters&name=Mathematics`.
2. **Chapters (SCR-05b):** The `[topicId]` segment holds the subject ID when `?view=chapters` is present. `getChapters(subjectId)` loads the list. Tapping a chapter navigates to `?view=topics&chapterId=ch-001&name=Ch.1&subject=Mathematics`.
3. **Topics (SCR-05c):** Same segment, `?view=topics`. `getTopics(chapterId)` loads the list. Topics already studied show a jade "Study →" badge; unstarted topics show a grey "Start →" badge. Tapping navigates to `/student/learn/[topicId]?title=Quadratic+Equations` — note that the topic title is passed as a query param because the `TopicDetail` API does not include it.
4. **Learning flow (SCR-06a–e):** When no `?view` param is present, the `[topicId]` segment is treated as a topic ID and the 5-step `LearningFlow` component is rendered. `getTopicDetail(topicId)` loads the content.
   - **Step 1** — Simple Definition: white shadow card.
   - **Step 2** — Nigerian Example: jade left-border accent card with "Local" badge.
   - **Step 3** — Visual Breakdown: monospace `<pre>` card (text diagrams; image generation is V2).
   - **Step 4** — Practice Questions: MCQ loop via `PracticeQuestion`. Correct answers turn jade; wrong answers turn coral. After the last question a `ScoreSummary` card shows `score/total`. ≥60% is jade; <60% is gold.
   - **Step 5** — AI Tutor: `AITutorScaffold` — shows a chat UI with a disabled input. Full AI chat is pending content-cache readiness (see §9).
5. Back navigation within the learning flow is fully wired: step N goes to step N-1; step 1 back calls `onExit` (router.back); returning from step 5 restores the score summary on step 4.

### 4.3 Progress Tracking Flow

1. `/student/progress` calls `getProgressData()` on mount.
2. Four stat cards render in a 2-column grid: **Streak** (jade, Flame icon), **Topics Studied**, **Avg Accuracy**, **Due Tomorrow**.
3. The **Subject Mastery** card lists each subject with a percentage label (jade ≥ 60%, gold < 60%) and a corresponding progress bar.
4. The **Study Activity** heatmap renders 63 cells (9 weeks × 7 days) using CSS grid with `grid-auto-flow: column` so weeks flow left-to-right. Five colour levels map activity 0–4 from `#EEEEEE` through `#085041`.
5. The **Upcoming Reviews** card lists each item with a coloured urgency dot (jade = high, gold = medium, grey = low) and a due-date label. "Today" labels render in jade text.

---

## 5. Mock Layer

### How `USE_MOCK` works

```ts
// lib/api/mock/week2.ts
export const USE_MOCK = true;
export const MOCK_DELAY_MS = 400;
```

Every API function in `lib/api/topics.ts` checks `USE_MOCK` as its first branch:

```ts
export async function getSubjects(): Promise<Subject[]> {
  if (USE_MOCK) {
    await delay(); // simulates network latency
    return mockSubjects;
  }
  // real fetch below
}
```

`delay()` is `new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS))`. Set `MOCK_DELAY_MS = 0` in unit tests that don't need skeleton state.

### Mock data exports (`lib/api/mock/data.ts`)

| Export | Description |
|---|---|
| `mockSubjects` | 5 subjects: Mathematics, English Language, Chemistry, Physics, Economics. Mastery set for first 3. |
| `mockChapters` | 5 chapters, all under `sub-001` (Mathematics). Ch-003 is "Equations & Inequalities". |
| `mockTopics` | 24 topics spread across all 5 chapters (≥4 per chapter). `top-001`–`top-005` in ch-003 are the primary learning-flow test topics. |
| `mockTopicDetail` | Full step1/step2/step3 content + 3 MCQs for `top-001` (Quadratic), `top-002` (Linear), `top-003` (Simultaneous), `top-004` (Acids & Bases), `top-005` (Comprehension). |
| `mockHomeData` | Ada Okonkwo / Kings Secondary School / streak 7. Recall queue references `top-004` and `top-001` and `top-005`. Recent topics reference the same three. |
| `mockRecallQueue` | 3 `RecallItem` objects: Acids & Bases pH question, Quadratic Equations formula question, Comprehension vocabulary technique question. |
| `mockProgressData` | streak 8, 24 topics, 71% accuracy, 3 due tomorrow. Subject mastery for Maths/English/Chemistry. 3 upcoming reviews. 63-cell heatmap (9 weeks × 7 days, activity levels 0–4). |

### Switching to real endpoints

1. Set `USE_MOCK = false` in `lib/api/mock/week2.ts`.
2. Ensure `NEXT_PUBLIC_API_URL` is set in `.env.local` (it already exists from Week 1).
3. The student must be logged in — all real calls include `Authorization: Bearer <token>` via `authHeaders()`. The in-memory token is set by the existing login flow in `lib/api/auth.ts`. If the token is missing, `authHeaders()` throws `ApiError(401, 'Not authenticated')`.
4. No page component changes are required. All mock/real branching is isolated to `lib/api/topics.ts`.

### Real API endpoints

| Function | Method + path |
|---|---|
| `getSubjects()` | `GET /api/v1/subjects` |
| `getChapters(subjectId)` | `GET /api/v1/subjects/:id/chapters` |
| `getTopics(chapterId)` | `GET /api/v1/chapters/:id/topics` |
| `getTopicDetail(topicId)` | `GET /api/v1/topics/:id` |
| `getHomeData()` | `GET /api/v1/student/home` |
| `getRecallQueue()` | `GET /api/v1/student/recall/queue` |
| `getProgressData()` | `GET /api/v1/student/progress` |

---

## 6. Components Built

| Component | File path | Props | Purpose |
|---|---|---|---|
| `BottomNav` | `components/student/BottomNav.tsx` | `recallCount?: number` | Fixed 5-tab bottom nav (Home, Browse, Recall, Progress, Settings). Active tab derived from `usePathname()`. Jade badge on Recall tab when `recallCount > 0`. |
| `RecallCard` | `components/student/RecallCard.tsx` | `queue: RecallQueueItem[], onStart: () => void` | Home screen recall card. Two states: jade-bordered card with topic names and CTA when queue has items; dashed empty state when queue is empty. |
| `SubjectCard` | `components/student/SubjectCard.tsx` | `subject: Subject, onClick: () => void` | Subject list row with subject-specific Lucide icon, chapter/topic count, and mastery badge (jade ≥60%, grey <60%, `—` when null). |
| `TopicListItem` | `components/student/TopicListItem.tsx` | `topic: Topic, onClick: () => void` | Topic list row with mastery subtitle (or "Not yet studied") and action badge (jade "Study →" if studied, grey "Start →" if not). Formats `last_studied_at` as relative time. |
| `LearningStep` | `components/student/LearningStep.tsx` | `step: 1 \| 2 \| 3, title: string, content: string` | Renders content for steps 1–3 with distinct visual treatments: white shadow card (1), jade left-border accent card with "Local" flag badge (2), monospace `<pre>` card (3). |
| `PracticeQuestion` | `components/student/PracticeQuestion.tsx` | `question: PracticeQuestion, onComplete: (correct: boolean) => void, isLast?: boolean` | MCQ question card. Tap reveals answer immediately — correct turns jade with Check icon, wrong turns coral with X icon, others grey out. Explanation card shown after reveal. CTA: "Next Question" or "Finish Practice". |
| `QualityRating` | `components/student/QualityRating.tsx` | `onRate: (rating: number) => void` | SM-2 quality rating grid. 6 buttons (0–5) with labels: No idea / Forgot / Hard / OK / Good / Perfect. 0–1 use dashed border (struggling); 2–4 use solid border; 5 is jade-filled. Calls `onRate` immediately on tap. |

---

## 7. Types Added

All interfaces live in `types/topics.ts`.

| Type | Description |
|---|---|
| `Subject` | Curriculum subject: `id`, `name`, `chapter_count`, `topic_count`, `mastery_percent \| null`. |
| `Chapter` | Curriculum chapter within a subject: `id`, `subject_id`, `title`, `topic_count`, `mastery_percent \| null`. |
| `Topic` | Individual study topic: `id`, `chapter_id`, `title`, `status: 'published'`, `mastery_percent \| null`, `last_studied_at \| null`. |
| `Step` | A single learning step: `title` and `content` (plain text or text-art diagram). |
| `PracticeQuestion` | MCQ: `type: 'mcq'`, `question`, `options` (A/B/C/D), `answer`, `explanation`. |
| `TopicDetail` | Full topic content: `step1`, `step2`, `step3`, `practice_questions: PracticeQuestion[]`. |
| `RecallQueueItem` | Lightweight recall queue entry used on the home screen: `topic_id`, `topic_title`, `subject`. |
| `RecentTopic` | Recently studied topic for home screen: `topic_id`, `topic_title`, `subject`, `mastery_percent`. |
| `HomeData` | Home screen API payload: `student_name`, `school_name`, `streak_days`, `recall_queue: RecallQueueItem[]`, `recent_topics: RecentTopic[]`. |
| `RecallItem` | Full recall session item with the actual question: `id`, `topic_id`, `topic_title`, `subject`, `question`, `model_answer`. |
| `SubjectMastery` | Subject name + mastery percent: `subject`, `mastery_percent`. Used within `ProgressData`. |
| `UpcomingReview` | Upcoming review entry: `topic_title`, `due` (string, e.g. "Today" / "Tomorrow" / "In 4 days"), `urgency: 'high' \| 'medium' \| 'low'`. |
| `ProgressData` | Full progress screen payload: `streak_days`, `topics_studied`, `avg_accuracy`, `due_tomorrow`, `subject_mastery: SubjectMastery[]`, `upcoming_reviews: UpcomingReview[]`, `heatmap_data: number[]` (63 values, 0–4). |

---

## 8. Environment Variables Required

No new environment variables were introduced this week.

The mock layer makes zero network calls, so `NEXT_PUBLIC_API_URL` is not consulted while `USE_MOCK = true`. That variable is already present in `.env.local` from the Week 1 auth screens and will be picked up automatically when the mock is switched off.

Auth token storage is in-memory only (a module-scoped `let` in `lib/api/auth.ts`). Nothing is written to `localStorage` or `sessionStorage` for auth purposes. The only `sessionStorage` write in this week's code is the recall queue serialisation in `recall/page.tsx` (key: `"recall_queue"`), which is intentional and transient.

---

## 9. Known Gaps and Next Steps

### SCR-08 AI Tutor Chat — scaffold only

`app/(student)/student/chat/page.tsx` renders a placeholder. The in-flow AI tutor scaffold in `LearningFlow` (step 5, `AITutorScaffold`) shows a disabled chat input and a static AI opening message. Full implementation is blocked on Bookey's content-cache API being ready. Tracked separately.

### Recall ratings not submitted

`RecallSessionPage` collects the user's 0–5 quality rating via `QualityRating.onRate` and uses it only to advance to the next item. No `POST` to submit ratings is made. This is intentional — the backend ticket for `POST /api/v1/student/recall/submit` (SM-2 EF update + next due date write) is not yet ready. When it is:

1. Add `submitRecallRatings(ratings: Record<string, number>): Promise<void>` to `lib/api/topics.ts`.
2. Reinstate the `ratings: Record<string, number>` state in `RecallSessionPage`.
3. Call `submitRecallRatings(ratings)` before rendering the SCR-07d completion screen.
4. Read the updated `streak_days` from the submit response instead of computing `mockHomeData.streak_days + 1`.

### Streak count on SCR-07d is derived from mock data

`newStreak = mockHomeData.streak_days + 1` is hardcoded in the session page. This value must come from the real submit response once the endpoint exists (see above).

### Subject filter pills are visual only

The four pills (All / Maths / English / Chem) on SCR-04a track active index in state but do not filter the `recent_topics` list in V1. Filtering requires either a richer `HomeData` response from the BE or a client-side filter added to `StudentHomePage`.

### Desktop responsiveness deferred

All student screens are designed for 375 px mobile. The `(student)` layout wrapper is a bare `<section>` with no max-width constraint. Desktop layout (centred column, max-width 430 px) was explicitly reverted this week and is deferred to a later sprint.

### `mockTopicDetail` coverage is limited

Full step content and MCQs exist only for `top-001` through `top-005`. Any other topic ID entered into the learning flow will hit the `ApiError(404)` branch and render an error state. This is fine for mock testing but must be expanded as the content team populates the database.
