'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { scaleTap, staggerContainer, staggerItem } from '@/lib/motion';
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

function AccuracyBar({ accuracy }: { accuracy: number }) {
  const fillColor =
    accuracy >= 60 ? 'bg-ink' : accuracy >= 40 ? 'bg-gray-400' : 'bg-bg-3';
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1 bg-bg-1 border border-border-2 rounded-full overflow-hidden shrink-0">
        <div
          className={`h-full rounded-full ${fillColor} transition-all duration-500`}
          style={{ width: `${accuracy}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold text-muted">
        {accuracy}%
      </span>
    </div>
  );
}

function StatusPill({
  status,
  streakDays,
}: {
  status: StudentDetail['recall_status'];
  streakDays: number;
}) {
  const base =
    'inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-[16px] border';

  if (status === 'on_track') {
    return (
      <span className={`${base} bg-bg-0 text-ink border-border-2 shadow-sm`}>
        <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
        Active
        {streakDays > 0 && (
          <>
            <span className="text-gray-300">·</span>
            <Flame size={12} strokeWidth={2} className="text-muted" />
            {streakDays} days
          </>
        )}
      </span>
    );
  }
  if (status === 'overdue') {
    return (
      <span className={`${base} bg-bg-1 text-warning border-border-2`}>
        <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
        Overdue
      </span>
    );
  }
  return (
    <span className={`${base} bg-bg-0 text-muted border-border-2`}>
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
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
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-error bg-error/10 px-2 py-0.5 rounded-[12px]">
        <AlertCircle size={11} strokeWidth={2} />
        Today
      </span>
    );
  }
  if (nextReview === 'Today') {
    return <span className="inline-flex items-center text-[11px] font-bold text-ink bg-bg-1 border border-border-2 px-2 py-0.5 rounded-[12px]">Today</span>;
  }
  return <span className="text-[11px] font-medium text-muted">{nextReview}</span>;
}

function TopicHistoryTable({ topics }: { topics: TopicHistory[] }) {
  return (
    <div className="bg-bg-0 border border-border-2 rounded-[24px] p-4 shadow-sm flex flex-col">
      <h2 className="text-[14px] font-extrabold text-ink mb-4 px-2 tracking-tight">
        Topic History
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border-2">
              <th className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted">
                Topic
              </th>
              <th className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted">
                Accuracy
              </th>
              <th className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted">
                Next Review
              </th>
              <th className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted">
                EF
              </th>
            </tr>
          </thead>
          <motion.tbody
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {topics.map((topic, idx) => (
              <motion.tr
                key={topic.topic_id}
                variants={staggerItem}
                className="border-b border-border-2 last:border-0 hover:bg-bg-1 transition-colors"
              >
                <td className="py-3 px-3 text-[12px] font-bold text-ink">
                  {topic.topic_title}
                </td>
                <td className="py-3 px-3">
                  <AccuracyBar accuracy={topic.accuracy} />
                </td>
                <td className="py-3 px-3">
                  <NextReviewCell
                    nextReview={topic.next_review}
                    overdue={topic.overdue}
                  />
                </td>
                <td className="py-3 px-3">
                  <span
                    className="inline-block text-[11px] font-mono font-bold bg-bg-1 border border-border-2 text-ink px-1.5 py-0.5 rounded-[6px] cursor-default"
                    title="Ease Factor — higher means better retention"
                  >
                    {topic.ease_factor.toFixed(1)}
                  </span>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
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
    <div className="bg-bg-0 border border-border-2 rounded-[24px] p-4 shadow-sm flex flex-col">
      <div className="mb-4 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-[14px] font-extrabold text-ink tracking-tight flex items-center gap-2">
            AI Chat Logs
            <span className="bg-bg-1 text-ink border border-border-2 text-[9px] px-2 py-0.5 rounded-[12px] uppercase tracking-widest">
              Grounded AI
            </span>
          </h2>
          <p className="text-[11px] font-medium text-muted mt-1">(Teacher Read-Only)</p>
        </div>
        <p className="text-[10px] font-bold text-muted tracking-widest uppercase">
          {sessions.length} Sessions · {totalMessages} Msgs
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {sessions.map((session, index) => {
          const isExpanded = expandedId === session.id;
          return (
            <motion.div
              layout
              key={session.id}
              className="bg-bg-0 border border-border-2 rounded-[16px] overflow-hidden"
            >
              <button
                onClick={() => toggle(session.id)}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-bg-1 transition-colors"
              >
                <span
                  className={`text-[12px] font-bold shrink-0 ${ index === 0 ? 'text-ink' : 'text-muted' }`}
                >
                  {session.date}
                </span>
                <span className="text-[10px] text-gray-300">·</span>
                <span className="text-[12px] font-medium text-muted">
                  {session.subject}
                </span>
                <span className="text-[10px] text-gray-300">·</span>
                <span className="text-[12px] font-semibold text-ink truncate">
                  {session.topic}
                </span>
                <span className="ml-auto text-[11px] font-bold text-muted bg-bg-1 px-2 py-0.5 rounded-[12px] shrink-0">
                  {session.message_count} msgs
                </span>
                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                  <ChevronDown
                    size={14}
                    strokeWidth={2}
                    className="text-muted shrink-0 ml-1"
                  />
                </motion.div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 border-t border-border-2 bg-bg-1/50"
                  >
                    <div className="flex flex-col gap-3 pt-4">
                      {session.preview_messages.map((msg, i) => (
                        <div key={i} className="flex gap-3">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-[8px] border border-border-2 h-fit shrink-0 ${ msg.role === 'ai' ? 'bg-ink text-white' : 'bg-bg-0 text-ink' }`}
                          >
                            {msg.role === 'ai' ? 'AI' : 'Student'}
                          </span>
                          <span className="text-[13px] font-medium text-ink-2 leading-relaxed mt-0.5">
                            {msg.content}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function StudentDetail({ student }: StudentDetailProps) {
  return (
    <div className="flex flex-col h-full bg-bg-1">
      {/* Top bar */}
      <div className="bg-bg-0 border-b border-border-2 px-6 py-4 flex flex-wrap items-center gap-4 shrink-0 shadow-sm z-10 relative">
        <motion.div {...scaleTap}>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-[12px] font-bold text-muted hover:text-ink hover:bg-bg-1 border border-border-2 rounded-[16px] px-3 py-1.5 transition-colors"
          >
            <ChevronLeft size={14} strokeWidth={2} />
            Back
          </Link>
        </motion.div>

        <h1 className="text-[16px] font-extrabold text-ink tracking-tight">
          {student.name}
        </h1>

        <StatusPill
          status={student.recall_status}
          streakDays={student.streak_days}
        />

        <div className="ml-auto">
          <motion.button
            {...scaleTap}
            className="flex items-center gap-2 text-[12px] font-bold text-ink bg-bg-0 border border-border-2 rounded-[16px] px-4 py-2 hover:bg-ink hover:text-white transition-colors"
          >
            <Download size={14} strokeWidth={2} />
            Export Data
          </motion.button>
        </div>
      </div>

      {/* Two-column body */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          <TopicHistoryTable topics={student.topic_history} />
          <ChatLogsPanel sessions={student.chat_sessions} />
        </div>
      </div>
    </div>
  );
}
