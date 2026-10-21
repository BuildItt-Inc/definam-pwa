import type { Subject, Chapter, Topic, TopicDetail, HomeData, RecallItem, ProgressData } from '@/types/topics';

export interface RecallSubmitResult {
  topic_id: string;
  interval_days: number;
  next_review_at: string;
  streak_days?: number; // returned after submit so UI can update without refetching dashboard
}
import { ApiError, getAuthHeaders } from '@/lib/api/auth';
import { USE_MOCK, MOCK_DELAY_MS } from '@/lib/api/mock/week2';
import {
  mockSubjects,
  mockChapters,
  mockTopics,
  mockTopicDetail,
  mockHomeData,
  mockRecallQueue,
  mockProgressData,
} from '@/lib/api/mock/data';

const delay = () => new Promise<void>((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    const errorMsg = body.detail || `API Error: ${res.status} ${res.statusText}`;
    throw new ApiError(res.status, errorMsg);
  }
  return res.json() as Promise<T>;
}

// ── SessionStorage Cache Helpers ──────────────────────────────────────────

function getSession<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`recall:${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function setSession<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`recall:${key}`, JSON.stringify(value));
  } catch {
    // Ignore quota errors in private browsing
  }
}

// ── In-memory curriculum cache (persists within session for instant transitions) ──
const curriculumCache = {
  subjects: null as Subject[] | null,
  chaptersByName: new Map<string, Chapter[]>(),
  topicsByChapter: new Map<string, Topic[]>(),
  topicDetails: new Map<string, TopicDetail>(),
};

export function clearCurriculumCache() {
  curriculumCache.subjects = null;
  curriculumCache.chaptersByName.clear();
  curriculumCache.topicsByChapter.clear();
  curriculumCache.topicDetails.clear();
  if (typeof window !== 'undefined') {
    try {
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith('recall:')) sessionStorage.removeItem(k);
      });
    } catch {}
  }
}

export function getCachedHomeData(): HomeData | null {
  return getSession<HomeData>('homeData');
}

export function getCachedSubjects(): Subject[] | null {
  return curriculumCache.subjects || getSession<Subject[]>('subjects');
}

export function getCachedRecallQueue(): RecallItem[] | null {
  return getSession<RecallItem[]>('recallQueue');
}

export function getCachedProgressData(): ProgressData | null {
  return getSession<ProgressData>('progressData');
}

// ── getSubjects ────────────────────────────────────────────────────────────
// Real: GET /api/v1/subjects

export async function getSubjects(): Promise<Subject[]> {
  if (curriculumCache.subjects) {
    return curriculumCache.subjects;
  }
  const fromSession = getSession<Subject[]>('subjects');
  if (fromSession && fromSession.length > 0) {
    curriculumCache.subjects = fromSession;
    // Silent background revalidation
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/subjects`, {
      headers: await getAuthHeaders().catch(() => ({})),
    })
      .then(handleResponse<Subject[]>)
      .then((data) => {
        curriculumCache.subjects = data;
        setSession('subjects', data);
      })
      .catch(() => {});
    return fromSession;
  }

  if (USE_MOCK) {
    await delay();
    curriculumCache.subjects = mockSubjects;
    return mockSubjects;
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/subjects`, {
    headers: await getAuthHeaders(),
  });
  const data = await handleResponse<Subject[]>(res);
  curriculumCache.subjects = data;
  setSession('subjects', data);
  return data;
}

// ── getChaptersBySubjectName ─────────────────────────────────────────────────
// Real: GET /api/v1/subjects/by-name/:name/chapters
// Returns chapters across every SS1/SS2/SS3 row sharing that subject name,
// each annotated with class_level so the caller can group them.

export async function getChaptersBySubjectName(subjectName: string): Promise<Chapter[]> {
  if (curriculumCache.chaptersByName.has(subjectName)) {
    return curriculumCache.chaptersByName.get(subjectName)!;
  }
  const fromSession = getSession<Chapter[]>(`chapters:${subjectName}`);
  if (fromSession && fromSession.length > 0) {
    curriculumCache.chaptersByName.set(subjectName, fromSession);
    return fromSession;
  }

  if (USE_MOCK) {
    await delay();
    void subjectName;
    curriculumCache.chaptersByName.set(subjectName, mockChapters);
    return mockChapters;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/subjects/by-name/${encodeURIComponent(subjectName)}/chapters`,
    { headers: await getAuthHeaders() },
  );
  const data = await handleResponse<Chapter[]>(res);
  curriculumCache.chaptersByName.set(subjectName, data);
  setSession(`chapters:${subjectName}`, data);
  return data;
}

// ── getTopics ──────────────────────────────────────────────────────────────
// Real: GET /api/v1/chapters/:id/topics

export async function getTopics(chapterId: string): Promise<Topic[]> {
  if (curriculumCache.topicsByChapter.has(chapterId)) {
    return curriculumCache.topicsByChapter.get(chapterId)!;
  }
  const fromSession = getSession<Topic[]>(`topics:${chapterId}`);
  if (fromSession && fromSession.length > 0) {
    curriculumCache.topicsByChapter.set(chapterId, fromSession);
    return fromSession;
  }

  if (USE_MOCK) {
    await delay();
    const data = mockTopics.filter((t) => t.chapter_id === chapterId);
    curriculumCache.topicsByChapter.set(chapterId, data);
    return data;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chapters/${chapterId}/topics`,
    { headers: await getAuthHeaders() },
  );
  const data = await handleResponse<Topic[]>(res);
  curriculumCache.topicsByChapter.set(chapterId, data);
  setSession(`topics:${chapterId}`, data);
  return data;
}

// ── getTopicDetail ─────────────────────────────────────────────────────────
// Real: GET /api/v1/topics/:id

export async function getTopicDetail(topicId: string): Promise<TopicDetail> {
  if (curriculumCache.topicDetails.has(topicId)) {
    return curriculumCache.topicDetails.get(topicId)!;
  }
  const fromSession = getSession<TopicDetail>(`topicDetail:${topicId}`);
  if (fromSession) {
    curriculumCache.topicDetails.set(topicId, fromSession);
    return fromSession;
  }

  if (USE_MOCK) {
    await delay();
    const detail = mockTopicDetail[topicId];
    if (!detail) throw new ApiError(404, `Topic detail not found: ${topicId}`);
    curriculumCache.topicDetails.set(topicId, detail);
    return detail;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/topics/${topicId}`,
    { headers: await getAuthHeaders() },
  );
  const data = await handleResponse<TopicDetail>(res);
  curriculumCache.topicDetails.set(topicId, data);
  setSession(`topicDetail:${topicId}`, data);
  return data;
}

// ── getHomeData ────────────────────────────────────────────────────────────
// Real: GET /api/v1/students/dashboard

export async function getHomeData(): Promise<HomeData> {
  if (USE_MOCK) {
    await delay();
    return mockHomeData;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/dashboard`,
    { headers: await getAuthHeaders() },
  );
  const data = await handleResponse<HomeData>(res);
  setSession('homeData', data);
  return data;
}

// ── getRecallQueue ─────────────────────────────────────────────────────────
// Real: GET /api/v1/student/recall/queue

export async function getRecallQueue(): Promise<RecallItem[]> {
  if (USE_MOCK) {
    await delay();
    return mockRecallQueue;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/recall/queue`,
    { headers: await getAuthHeaders() },
  );

  type RawItem = {
    topic_id: string;
    title: string;
    subject: string | null;
    question: string | null;
    model_answer: string | null;
    next_review_at: string | null;
  };

  const raw = await handleResponse<RawItem[]>(res);
  const items: RawItem[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && 'data' in raw && Array.isArray((raw as { data: unknown }).data)
      ? (raw as { data: RawItem[] }).data
      : [];

  const result = items
    .filter((item) => item.question && item.model_answer)
    .map((item) => ({
      id: item.topic_id,
      topic_id: item.topic_id,
      topic_title: item.title,
      subject: item.subject ?? '',
      question: item.question!,
      model_answer: item.model_answer!,
    }));
  setSession('recallQueue', result);
  return result;
}

// ── getProgressData ────────────────────────────────────────────────────────
// Real: GET /api/v1/student/progress

export async function getProgressData(): Promise<ProgressData> {
  if (USE_MOCK) {
    await delay();
    return mockProgressData;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/student/progress`,
    { headers: await getAuthHeaders() },
  );

  type RawProgress = {
    streak_days: number;
    topics_studied: number;
    avg_accuracy: number;
    due_tomorrow: number;
    subject_mastery: { subject: string; mastery_percent: number }[];
    upcoming_reviews: { topic_title: string; due: string; urgency: string }[];
    heatmap_data: number[];
  };

  const raw = await handleResponse<RawProgress | null>(res);
  const d: Partial<RawProgress> =
    (raw && typeof raw === 'object' && 'data' in raw
      ? (raw as { data: RawProgress }).data
      : raw) ?? {};

  const result: ProgressData = {
    streak_days: d.streak_days ?? 0,
    topics_studied: d.topics_studied ?? 0,
    avg_accuracy: d.avg_accuracy ?? 0,
    due_tomorrow: d.due_tomorrow ?? 0,
    subject_mastery: Array.isArray(d.subject_mastery) ? d.subject_mastery : [],
    upcoming_reviews: Array.isArray(d.upcoming_reviews)
      ? d.upcoming_reviews.map((r) => ({
        topic_title: r?.topic_title ?? '',
        due: r?.due ?? '',
        urgency: (r?.urgency === 'high' || r?.urgency === 'medium' ? r?.urgency : 'low') as
          | 'high'
          | 'medium'
          | 'low',
      }))
      : [],
    heatmap_data: Array.isArray(d.heatmap_data) ? d.heatmap_data : [],
  };
  setSession('progressData', result);
  return result;
}

// ── pingTopicActivity ──────────────────────────────────────────────────────
// Real: POST /api/v1/topics/:id/activity
// Fire when a student opens or progresses through a topic's learning steps.
// Not gated on completion — powers the streak's "showed up today" signal.
// Idempotent server-side, so callers don't need to debounce beyond
// "roughly once per step viewed".

export interface ActivityPingResult {
  ok: boolean;
  streak_incremented_today: boolean;
  streak_days: number;
}

export async function pingTopicActivity(topicId: string): Promise<ActivityPingResult | null> {
  if (USE_MOCK) return null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/topics/${topicId}/activity`, {
      method: 'POST',
      headers: await getAuthHeaders(),
    });
    if (!res.ok) return null;
    return (await res.json()) as ActivityPingResult;
  } catch {
    // Best-effort — never block the learning flow on this.
    return null;
  }
}

// ── submitTopicCompletion ──────────────────────────────────────────────────
// Real: POST /api/v1/topics/:id/review
// Call when the student finishes Step 4 (practice questions) for a topic.
// Creates the topic's first TopicReview row if one doesn't exist yet, which
// is what makes it eligible for the recall queue.

export async function submitTopicCompletion(
  topicId: string,
  accuracyScore: number,
): Promise<boolean> {
  if (USE_MOCK) return true;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/topics/${topicId}/review`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ accuracy_score: accuracyScore }),
    });
    if (res.ok) {
      curriculumCache.topicDetails.delete(topicId);
      curriculumCache.topicsByChapter.clear();
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem(`recall:topicDetail:${topicId}`);
        } catch {}
      }
    }
    return res.ok;
  } catch {
    // Best-effort — a failed completion ping shouldn't block the UI; the
    // student still sees their score summary either way.
    return false;
  }
}

// ── submitRecallRating ─────────────────────────────────────────────────────
// Real: POST /api/v1/topics/:id/recall

export async function submitRecallRating(
  topicId: string,
  rating: number,
): Promise<RecallSubmitResult> {
  if (USE_MOCK) {
    await delay();
    return { topic_id: topicId, interval_days: 1, next_review_at: new Date().toISOString() };
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/topics/${topicId}/recall`,
    {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ rating }),
    },
  );
  return handleResponse<RecallSubmitResult>(res);
}
