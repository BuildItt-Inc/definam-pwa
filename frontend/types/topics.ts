export interface Subject {
  id: string;
  name: string;
  chapter_count: number;
  topic_count: number;
  mastery_percent: number | null;
}

export interface Chapter {
  id: string;
  subject_id: string;
  title: string;
  topic_count: number;
  mastery_percent: number | null;
}

export interface Topic {
  id: string;
  chapter_id: string;
  title: string;
  status: 'published';
  mastery_percent: number | null;
  last_studied_at: string | null;
}

export interface Step {
  title: string;
  content: string;
}

export interface PracticeQuestion {
  type: 'mcq';
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export interface TopicDetail {
  step1: Step;
  step2: Step;
  step3: Step;
  practice_questions: PracticeQuestion[];
}

export interface RecallQueueItem {
  topic_id: string;
  topic_title: string;
  subject: string;
}

export interface RecentTopic {
  topic_id: string;
  topic_title: string;
  subject: string;
  mastery_percent: number;
}

export interface HomeData {
  student_name: string;
  school_name: string;
  streak_days: number;
  recall_queue: RecallQueueItem[];
  recent_topics: RecentTopic[];
}

export interface RecallItem {
  id: string;
  topic_id: string;
  topic_title: string;
  subject: string;
  question: string;
  model_answer: string;
}
