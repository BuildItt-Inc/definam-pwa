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
    const errorMsg = body.error || `API Error: ${res.status} ${res.statusText}`;
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

// ── getChapters ────────────────────────────────────────────────────────────
// Real: GET /api/v1/subjects/:id/chapters

export async function getChapters(subjectId: string): Promise<Chapter[]> {
  if (USE_MOCK) {
    await delay();
    return mockChapters.filter((ch) => ch.subject_id === subjectId);
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/subjects/${subjectId}/chapters`,
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
  const items: RawItem[] = (raw && typeof raw === 'object' && 'data' in raw)
    ? (raw as unknown as { data: RawItem[] }).data
    : raw;

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
  // Always mock for now since the backend doesn't have a consolidated /progress endpoint yet.
  await delay();
  return mockProgressData;
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
