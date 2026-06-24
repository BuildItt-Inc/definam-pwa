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
