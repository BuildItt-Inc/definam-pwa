'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Download,
  Flame,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { StudentDetail, TopicHistory, ChatSession } from '@/types/admin';

interface StudentDetailProps {
  student: StudentDetail;
}

function accuracyBarColor(accuracy: number): string {
  if (accuracy >= 60) return 'bg-jade';
  if (accuracy >= 40) return 'bg-gold';
  return 'bg-coral';
}

function StatusPill({
  status,
  streakDays,
}: {
  status: StudentDetail['recall_status'];
  streakDays: number;
}) {
  const base =
    'inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-sm border';

  if (status === 'on_track') {
    return (
      <span className={`${base} bg-jade text-white border-jade`}>
        Active
        {streakDays > 0 && (
          <>
            <span className="opacity-60">·</span>
            <Flame size={11} strokeWidth={1.5} />
            {streakDays} days
          </>
        )}
      </span>
    );
  }
  if (status === 'overdue') {
    return (
      <span className={`${base} bg-[#555555] text-white border-[#555555]`}>
        Overdue
      </span>
    );
  }
  return (
    <span className={`${base} bg-transparent text-[#555555] border-gray-300`}>
      Not Started
    </span>
  );
}

function NextReviewCell({
  nextReview,
  overdue,
}: {
  nextReview: string;
  overdue: boolean;
}) {
  if (nextReview === 'Today' && overdue) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-coral">
        <AlertCircle size={11} strokeWidth={1.5} />
        Today
      </span>
    );
  }
  if (nextReview === 'Today') {
    return <span className="text-[11px] font-medium text-jade">Today</span>;
  }
  return <span className="text-[11px] text-gray-400">{nextReview}</span>;
}

function TopicHistoryTable({ topics }: { topics: TopicHistory[] }) {
  return (
    <div>
      <h2 className="font-syne text-[13px] font-extrabold text-ink mb-2">
        Topic History
      </h2>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-2 px-3 text-left text-[9px] font-bold uppercase tracking-wider text-gray-400">
                Topic
              </th>
              <th className="py-2 px-3 text-left text-[9px] font-bold uppercase tracking-wider text-gray-400">
                Accuracy
              </th>
              <th className="py-2 px-3 text-left text-[9px] font-bold uppercase tracking-wider text-gray-400">
                Next Review
              </th>
              <th className="py-2 px-3 text-left text-[9px] font-bold uppercase tracking-wider text-gray-400">
                EF
              </th>
            </tr>
          </thead>
          <tbody>
            {topics.map((topic) => (
              <tr
                key={topic.topic_id}
                className="border-b border-gray-100 last:border-0 hover:bg-jade/5 transition-colors"
              >
                <td className="py-2.5 px-3 text-[11px] font-semibold text-ink">
                  {topic.topic_title}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-1 bg-gray-100 rounded-full border border-gray-200 overflow-hidden shrink-0">
                      <div
                        className={`h-full rounded-full ${accuracyBarColor(topic.accuracy)}`}
                        style={{ width: `${topic.accuracy}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-gray-500">
                      {topic.accuracy}%
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <NextReviewCell
                    nextReview={topic.next_review}
                    overdue={topic.overdue}
                  />
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className="text-[11px] text-gray-400 cursor-default"
                    title="Ease Factor — higher means better retention"
                  >
                    {topic.ease_factor.toFixed(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChatLogsPanel({ sessions }: { sessions: ChatSession[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(
    sessions[0]?.id ?? null,
  );

  const totalMessages = sessions.reduce((sum, s) => sum + s.message_count, 0);

  function toggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div>
      <div className="mb-2">
        <h2 className="font-syne text-[13px] font-extrabold text-ink">
          AI Chat Logs
        </h2>
        <p className="text-[10px] text-gray-400">(Teacher Read-Only)</p>
      </div>

      <p className="text-[11px] font-bold text-ink mb-1.5">All Chat Sessions</p>

      <div className="flex flex-col gap-2">
        {sessions.map((session, index) => {
          const isExpanded = expandedId === session.id;
          return (
            <div
              key={session.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggle(session.id)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                <span
                  className={`text-[11px] font-semibold shrink-0 ${
                    index === 0 ? 'text-jade' : 'text-gray-400'
                  }`}
                >
                  {session.date}
                </span>
                <span className="text-[10px] text-gray-300">·</span>
                <span className="text-[11px] text-gray-500">
                  {session.subject}
                </span>
                <span className="text-[10px] text-gray-300">·</span>
                <span className="text-[11px] text-gray-500 truncate">
                  {session.topic}
                </span>
                <span className="ml-auto text-[10px] text-gray-300 shrink-0">
                  {session.message_count} msgs
                </span>
                {isExpanded ? (
                  <ChevronUp
                    size={12}
                    strokeWidth={1.5}
                    className="text-gray-400 shrink-0"
                  />
                ) : (
                  <ChevronDown
                    size={12}
                    strokeWidth={1.5}
                    className="text-gray-400 shrink-0"
                  />
                )}
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-100 bg-gray-50">
                  <div className="flex flex-col gap-2.5 pt-2.5">
                    {session.preview_messages.map((msg, i) => (
                      <div key={i} className="flex gap-2">
                        <span
                          className={`text-[10px] font-bold min-w-[30px] shrink-0 ${
                            msg.role === 'ai' ? 'text-jade' : 'text-gray-400'
                          }`}
                        >
                          {msg.role === 'ai' ? 'AI' : 'Student'}
                        </span>
                        <span className="text-[11px] text-gray-500 leading-relaxed">
                          {msg.content}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-200 text-[10px] text-gray-300">
                    {sessions.length} sessions this week · {totalMessages} messages total
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StudentDetail({ student }: StudentDetailProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-5 py-2.5 flex items-center gap-3 shrink-0">
        <Link
          href="/admin"
          className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-ink border border-gray-200 rounded px-2.5 py-1.5 transition-colors"
        >
          <ChevronLeft size={12} strokeWidth={1.5} />
          Back to Class
        </Link>

        <h1 className="font-syne text-[13px] font-extrabold text-ink ml-2">
          {student.name}
        </h1>

        <StatusPill
          status={student.recall_status}
          streakDays={student.streak_days}
        />

        <div className="ml-auto">
          <button className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 border border-gray-200 rounded px-3 py-1.5 hover:bg-gray-50 transition-colors">
            <Download size={12} strokeWidth={1.5} />
            Export This Student
          </button>
        </div>
      </div>

      {/* Two-column body */}
      <div className="flex-1 p-5 bg-gray-50 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <TopicHistoryTable topics={student.topic_history} />
          <ChatLogsPanel sessions={student.chat_sessions} />
        </div>
      </div>
    </div>
  );
}
