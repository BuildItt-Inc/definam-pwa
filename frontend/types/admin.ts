export type RecallStatus = 'on_track' | 'overdue' | 'not_started';

export interface AIAlert {
  topic: string;
  students_below_60: number;
  total_students: number;
  ef_avg: number;
}

export interface StudentRow {
  id: string;
  name: string;
  streak_days: number;
  recall_status: RecallStatus;
  overdue_days: number;
  avg_accuracy: number;
  weakest_topic: string;
  weakest_topic_accuracy: number;
  weakest_subject: string;
  last_active: string;
}

export interface AdminDashboardData {
  school_name: string;
  class_name: string;
  teacher_name: string;
  location: string;
  total_students: number;
  active_this_week: number;
  class_avg_accuracy: number;
  accuracy_delta: number;
  recall_overdue: number;
  active_subjects: string[];
  ai_alert: AIAlert;
  students: StudentRow[];
}

export interface PreviewMessage {
  role: 'ai' | 'student';
  content: string;
}

export interface ChatSession {
  id: string;
  date: string;
  subject: string;
  topic: string;
  message_count: number;
  preview_messages: PreviewMessage[];
}

export interface TopicHistory {
  topic_id: string;
  topic_title: string;
  accuracy: number;
  next_review: string;
  ease_factor: number;
  overdue: boolean;
}

export interface StudentDetail {
  id: string;
  name: string;
  streak_days: number;
  recall_status: RecallStatus;
  topic_history: TopicHistory[];
  chat_sessions: ChatSession[];
}

// ── SCR-12 · Access Code Management ───────────────────────────────────────

export type AccessCodeStatus = 'active' | 'unused';

export interface SubscriptionInfo {
  term: string;
  status: 'active' | 'inactive';
  total_seats: number;
  expires_at: string;
}

export interface CodeStats {
  total: number;
  activated: number;
  unused: number;
}

export interface AccessCode {
  id: string;
  code: string;
  student_name: string | null;
  status: AccessCodeStatus;
  activated_at: string | null;
}

export interface AccessCodesData {
  subscription: SubscriptionInfo;
  stats: CodeStats;
  codes: AccessCode[];
}
