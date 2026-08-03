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
    const body = await res.json().catch(() => ({ error: '' }));
    const errorMsg = body.detail || `API Error: ${res.status} ${res.statusText}`;
    throw new ApiError(res.status, errorMsg);
  }
  return res.json() as Promise<T>;
}

// ── getSubjects ────────────────────────────────────────────────────────────
// Real: GET /api/v1/subjects

export async function getSubjects(): Promise<Subject[]> {
  if (USE_MOCK) {
    await delay();
    return mockSubjects;
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/subjects`, {
    headers: await getAuthHeaders(),
  });
  return handleResponse<Subject[]>(res);
}

// ── getChaptersBySubjectName ─────────────────────────────────────────────────
// Real: GET /api/v1/subjects/by-name/:name/chapters
// Returns chapters across every SS1/SS2/SS3 row sharing that subject name,
// each annotated with class_level so the caller can group them.

export async function getChaptersBySubjectName(subjectName: string): Promise<Chapter[]> {
  if (USE_MOCK) {
    await delay();
    // Mock data only models one subject's chapters — grouping by name isn't
    // meaningfully mockable, so just return them regardless of which
    // subject was requested.
    void subjectName;
    return mockChapters;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/subjects/by-name/${encodeURIComponent(subjectName)}/chapters`,
    { headers: await getAuthHeaders() },
  );
  return handleResponse<Chapter[]>(res);
}

// ── getTopics ──────────────────────────────────────────────────────────────
// Real: GET /api/v1/chapters/:id/topics

export async function getTopics(chapterId: string): Promise<Topic[]> {
  if (USE_MOCK) {
    await delay();
    return mockTopics.filter((t) => t.chapter_id === chapterId);
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chapters/${chapterId}/topics`,
    { headers: await getAuthHeaders() },
  );
  return handleResponse<Topic[]>(res);
}

// ── getTopicDetail ─────────────────────────────────────────────────────────
// Real: GET /api/v1/topics/:id

export async function getTopicDetail(topicId: string): Promise<TopicDetail> {
  if (USE_MOCK) {
    await delay();
    const detail = mockTopicDetail[topicId];
    if (!detail) throw new ApiError(404, `Topic detail not found: ${topicId}`);
    return detail;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/topics/${topicId}`,
    { headers: await getAuthHeaders() },
  );
  return handleResponse<TopicDetail>(res);
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
  return handleResponse<HomeData>(res);
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

  return items
    .filter((item) => item.question && item.model_answer)
    .map((item) => ({
      id: item.topic_id,
      topic_id: item.topic_id,
      topic_title: item.title,
      subject: item.subject ?? '',
      question: item.question!,
      model_answer: item.model_answer!,
    }));
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

  return {
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
