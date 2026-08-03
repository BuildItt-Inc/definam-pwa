export interface Subject {
  // One entry per unique subject NAME — deduplicated across the SS1/SS2/SS3
  // class-level rows behind it, which have no single shared id. `name` is
  // the key: use it for both the React list key and the chapters lookup.
  name: string;
  chapter_count: number;
  topic_count: number;
  mastery_percent: number | null;
}

export interface Chapter {
  id: string;
  subject_id: string;
  // Which class-level row (SS1/SS2/SS3) this chapter belongs to — a
  // subject name spans multiple rows, so this is how the UI groups
  // chapters under level section headers.
  class_level: string;
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
  // Overall completion across every subject/topic in the curriculum (not
  // per-topic mastery) — powers the dashboard header's completion ring.
  completion_percent: number;
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

export interface SubjectMastery {
  subject: string;
  mastery_percent: number;
}

export interface UpcomingReview {
  topic_title: string;
  due: string;
  urgency: 'high' | 'medium' | 'low';
}

export interface ProgressData {
  streak_days: number;
  topics_studied: number;
  avg_accuracy: number;
  due_tomorrow: number;
  subject_mastery: SubjectMastery[];
  upcoming_reviews: UpcomingReview[];
  heatmap_data: number[];
}
