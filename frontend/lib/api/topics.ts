import type { Subject, Chapter, Topic, TopicDetail, HomeData, RecallItem } from '@/types/topics';
import { ApiError, getAccessToken } from '@/lib/api/auth';
import { USE_MOCK, MOCK_DELAY_MS } from '@/lib/api/mock/week2';
import {
  mockSubjects,
  mockChapters,
  mockTopics,
  mockTopicDetail,
  mockHomeData,
  mockRecallQueue,
} from '@/lib/api/mock/data';

const delay = () => new Promise<void>((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  if (!token) throw new ApiError(401, 'Not authenticated');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: '' }));
    throw new ApiError(res.status, body.error ?? '');
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
    headers: authHeaders(),
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
    { headers: authHeaders() },
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
    { headers: authHeaders() },
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
    { headers: authHeaders() },
  );
  return handleResponse<TopicDetail>(res);
}

// ── getHomeData ────────────────────────────────────────────────────────────
// Real: GET /api/v1/student/home

export async function getHomeData(): Promise<HomeData> {
  if (USE_MOCK) {
    await delay();
    return mockHomeData;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/student/home`,
    { headers: authHeaders() },
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
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/student/recall/queue`,
    { headers: authHeaders() },
  );
  return handleResponse<RecallItem[]>(res);
}
