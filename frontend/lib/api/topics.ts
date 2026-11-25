import type { Subject, Chapter, Topic, TopicDetail, HomeData, RecallItem, ProgressData } from '@/types/topics';

export interface RecallSubmitResult {
  topic_id: string;
  interval_days: number;
  next_review_at: string;
  streak_days?: number; // returned after submit so UI can update without refetching dashboard
}
import { ApiError, getAuthHeaders } from '@/lib/api/auth';
import { USE_MOCK, MOCK_DELAY_MS } from '@/lib/api/mock/week2';

const delay = () => new Promise<void>((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

/** Extract a readable string from FastAPI detail — handles both string and Pydantic array shapes. */
function extractDetail(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const d = (body as Record<string, unknown>)['detail'];
  if (!d) return fallback;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) {
    const msgs = d
      .map((item) => (typeof item === 'object' && item !== null ? (item as Record<string, unknown>)['msg'] : null))
      .filter((m): m is string => typeof m === 'string');
    return msgs.length > 0 ? msgs.join('. ') : fallback;
  }
  return fallback;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new ApiError(res.status, extractDetail(body, `API Error: ${res.status} ${res.statusText}`));
  }
  return res.json() as Promise<T>;
}

// ── Persistent Cache Helpers (localStorage for offline/PWA cold start + session fallback) ──

function readCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  const storageKey = `recall:${key}`;
  try {
    const raw = localStorage.getItem(storageKey) ?? sessionStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  const storageKey = `recall:${key}`;
  const serialized = JSON.stringify(value);
  try {
    localStorage.setItem(storageKey, serialized);
  } catch {
    try {
      sessionStorage.setItem(storageKey, serialized);
    } catch {
      // Ignore quota errors in private browsing
    }
  }
}

function removeCache(key: string): void {
  if (typeof window === 'undefined') return;
  const storageKey = `recall:${key}`;
  try {
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem(storageKey);
  } catch {}
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
    for (const store of [localStorage, sessionStorage]) {
      try {
        Object.keys(store).forEach((k) => {
          if (k.startsWith('recall:')) store.removeItem(k);
        });
      } catch {}
    }
  }
}

export function getCachedHomeData(): HomeData | null {
  return readCache<HomeData>('homeData');
}

export function getCachedSubjects(): Subject[] | null {
  return curriculumCache.subjects || readCache<Subject[]>('subjects');
}

export function getCachedChaptersBySubjectName(subjectName: string): Chapter[] | null {
  return curriculumCache.chaptersByName.get(subjectName) || readCache<Chapter[]>(`chapters:${subjectName}`);
}

export function getCachedTopics(chapterId: string): Topic[] | null {
  return curriculumCache.topicsByChapter.get(chapterId) || readCache<Topic[]>(`topics:${chapterId}`);
}

export function getCachedTopicDetail(topicId: string): TopicDetail | null {
  return curriculumCache.topicDetails.get(topicId) || readCache<TopicDetail>(`topicDetail:${topicId}`);
}

export function getCachedRecallQueue(): RecallItem[] | null {
  return readCache<RecallItem[]>('recallQueue');
}

export function getCachedProgressData(): ProgressData | null {
  return readCache<ProgressData>('progressData');
}

// ── getSubjects ────────────────────────────────────────────────────────────
// Real: GET /api/v1/subjects

export async function getSubjects(): Promise<Subject[]> {
  const cached = getCachedSubjects();
  if (cached && cached.length > 0) {
    curriculumCache.subjects = cached;
    // Silent background revalidation so curriculum counts/mastery stay fresh
    getAuthHeaders()
      .then((headers) => fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/subjects`, { headers }))
      .then(handleResponse<Subject[]>)
      .then((data) => {
        curriculumCache.subjects = data;
        writeCache('subjects', data);
      })
      .catch(() => {});
    return cached;
  }

  if (USE_MOCK) {
    await delay();
    const { mockSubjects } = await import('@/lib/api/mock/data');
    curriculumCache.subjects = mockSubjects;
    return mockSubjects;
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/subjects`, {
    headers: await getAuthHeaders(),
  });
  const data = await handleResponse<Subject[]>(res);
  curriculumCache.subjects = data;
  writeCache('subjects', data);
  return data;
}

// ── getChaptersBySubjectName ─────────────────────────────────────────────────
// Real: GET /api/v1/subjects/by-name/:name/chapters
// Returns chapters across every SS1/SS2/SS3 row sharing that subject name,
// each annotated with class_level so the caller can group them.

export async function getChaptersBySubjectName(subjectName: string): Promise<Chapter[]> {
  const cached = getCachedChaptersBySubjectName(subjectName);
  const fetchFresh = async () => {
    if (USE_MOCK) {
      await delay();
      const { mockChapters } = await import('@/lib/api/mock/data');
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
    writeCache(`chapters:${subjectName}`, data);
    return data;
  };

  if (cached && cached.length > 0) {
    curriculumCache.chaptersByName.set(subjectName, cached);
    // Silent SWR revalidation in background so chapter mastery stays fresh
    void fetchFresh().catch(() => {});
    return cached;
  }

  return fetchFresh();
}

// ── getTopics ──────────────────────────────────────────────────────────────
// Real: GET /api/v1/chapters/:id/topics

export async function getTopics(chapterId: string): Promise<Topic[]> {
  const cached = getCachedTopics(chapterId);
  const fetchFresh = async () => {
    if (USE_MOCK) {
      await delay();
      const { mockTopics } = await import('@/lib/api/mock/data');
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
    writeCache(`topics:${chapterId}`, data);
    return data;
  };

  if (cached && cached.length > 0) {
    curriculumCache.topicsByChapter.set(chapterId, cached);
    // Silent SWR revalidation so topic mastery badges update
    void fetchFresh().catch(() => {});
    return cached;
  }

  return fetchFresh();
}

// ── getTopicDetail ─────────────────────────────────────────────────────────
// Real: GET /api/v1/topics/:id

export async function getTopicDetail(topicId: string): Promise<TopicDetail> {
  const cached = getCachedTopicDetail(topicId);
  if (cached) {
    curriculumCache.topicDetails.set(topicId, cached);
    return cached;
  }

  if (USE_MOCK) {
    await delay();
    const { mockTopicDetail } = await import('@/lib/api/mock/data');
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
  writeCache(`topicDetail:${topicId}`, data);
  return data;
}

// ── getHomeData ────────────────────────────────────────────────────────────
// Real: GET /api/v1/students/dashboard

export async function getHomeData(): Promise<HomeData> {
  if (USE_MOCK) {
    await delay();
    const { mockHomeData } = await import('@/lib/api/mock/data');
    return mockHomeData;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/dashboard`,
    { headers: await getAuthHeaders() },
  );
  const data = await handleResponse<HomeData>(res);
  writeCache('homeData', data);
  return data;
}

// ── getRecallQueue ─────────────────────────────────────────────────────────
// Real: GET /api/v1/student/recall/queue

export async function getRecallQueue(): Promise<RecallItem[]> {
  if (USE_MOCK) {
    await delay();
    const { mockRecallQueue } = await import('@/lib/api/mock/data');
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
  writeCache('recallQueue', result);
  return result;
}

// ── getProgressData ────────────────────────────────────────────────────────
// Real: GET /api/v1/student/progress

export async function getProgressData(): Promise<ProgressData> {
  if (USE_MOCK) {
    await delay();
    const { mockProgressData } = await import('@/lib/api/mock/data');
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
  writeCache('progressData', result);
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
      removeCache(`topicDetail:${topicId}`);
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
  const result = await handleResponse<RecallSubmitResult>(res);

  // Optimistically remove this topic from cached recallQueue so Home/BottomNav badge stays accurate
  const cachedQueue = getCachedRecallQueue();
  if (cachedQueue) {
    const nextQueue = cachedQueue.filter((item) => item.topic_id !== topicId);
    writeCache('recallQueue', nextQueue);
    if (typeof window !== 'undefined') {
      const { filterTopicsByProfile, getStudentProfile } = await import('@/lib/utils/studentProfile');
      const filteredCount = filterTopicsByProfile(nextQueue, getStudentProfile()).length;
      window.dispatchEvent(new CustomEvent('recallQueueUpdated', { detail: filteredCount }));
    }
  }
  return result;
}
