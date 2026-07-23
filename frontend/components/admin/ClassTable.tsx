'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Flame, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, scaleTap } from '@/lib/motion';
import type { StudentRow } from '@/types/admin';

interface ClassTableProps {
  students: StudentRow[];
  activeSubjects: string[];
  onViewStudent: (studentId: string) => void;
}

function AccuracyBar({ accuracy }: { accuracy: number }) {
  const fillColor =
    accuracy >= 60 ? 'bg-ink' : accuracy >= 40 ? 'bg-gray-400' : 'bg-bg-3';
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1 bg-bg-1 border border-border-2 rounded-full overflow-hidden">
        <div
          className={`h-full ${fillColor} rounded-full transition-all duration-500`}
          style={{ width: `${accuracy}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold text-ink">{accuracy}%</span>
    </div>
  );
}

function RecallBadge({ status, overdueDays }: { status: StudentRow['recall_status']; overdueDays: number }) {
  if (status === 'on_track') {
    return (
      <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-[16px] bg-bg-0 text-ink border border-border-2">
        <span className="w-1.5 h-1.5 rounded-full bg-success mr-1.5" />
        On Track
      </span>
    );
  }
  if (status === 'overdue') {
    return (
      <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-[16px] bg-bg-1 text-warning border border-border-2">
        <span className="w-1.5 h-1.5 rounded-full bg-warning mr-1.5" />
        {overdueDays} {overdueDays === 1 ? 'Day' : 'Days'} Overdue
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-[16px] bg-bg-0 text-muted border border-border-2">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-1.5" />
      Not Started
    </span>
  );
}

export function ClassTable({ students, activeSubjects, onViewStudent }: ClassTableProps) {
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('All Subjects');

  const filtered = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesSubject =
      subject === 'All Subjects' || s.weakest_subject === subject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="bg-bg-0 border border-border-2 rounded-[24px] overflow-hidden shadow-sm">
      {/* Table header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 border-b border-border-2 bg-bg-1/50">
        <span className="text-[14px] font-extrabold text-ink tracking-tight">All Students</span>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {/* Search */}
          <div className="flex items-center gap-2 border border-border-2 bg-bg-0 rounded-[16px] px-3 py-[7px] focus-within:border-ink transition-colors">
            <Search size={14} className="text-muted shrink-0" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-[12px] font-semibold text-ink bg-transparent outline-none w-36 placeholder:text-muted placeholder:font-medium"
            />
          </div>

          {/* Subject filter */}
          <div className="relative flex items-center border border-border-2 bg-bg-0 rounded-[16px] px-3 py-[7px] gap-2 hover:border-ink transition-colors cursor-pointer">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-[12px] font-semibold text-ink bg-transparent outline-none appearance-none pr-6 cursor-pointer"
            >
              <option value="All Subjects">All Subjects</option>
              {activeSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="text-muted pointer-events-none absolute right-3"
              strokeWidth={2}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-bg-0">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-border-2 whitespace-nowrap">
                Student
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-border-2 whitespace-nowrap">
                Streak
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-border-2 whitespace-nowrap">
                Review Status
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-border-2 whitespace-nowrap">
                Avg Accuracy
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-border-2 whitespace-nowrap">
                Weakest Topic
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-border-2 whitespace-nowrap">
                Last Active
              </th>
              <th className="px-6 py-4 border-b border-border-2" />
            </tr>
          </thead>
          <motion.tbody
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-[12px] font-medium text-muted"
                >
                  No students match your filters.
                </td>
              </tr>
            )}
            {filtered.map((student, idx) => {
              const rowBg = idx % 2 === 0 ? 'bg-bg-0' : 'bg-bg-1/30';
              return (
                <motion.tr
                  key={student.id}
                  variants={staggerItem}
                  className={`${rowBg} hover:bg-bg-1 transition-colors group cursor-pointer`}
                  onClick={() => onViewStudent(student.id)}
                >
                  {/* Name */}
                  <td className="px-6 py-4 border-b border-border-2">
                    <span className="text-[13px] font-bold text-ink">
                      {student.name}
                    </span>
                  </td>

                  {/* Streak */}
                  <td className="px-6 py-4 border-b border-border-2 whitespace-nowrap">
                    {student.streak_days > 0 ? (
                      <span className="flex items-center gap-1.5 text-[12px] font-bold text-ink">
                        <Flame size={14} className="text-muted" strokeWidth={2} />
                        {student.streak_days} days
                      </span>
                    ) : (
                      <span className="text-[12px] font-medium text-gray-300">—</span>
                    )}
                  </td>

                  {/* Recall status */}
                  <td className="px-6 py-4 border-b border-border-2">
                    <RecallBadge
                      status={student.recall_status}
                      overdueDays={student.overdue_days}
                    />
                  </td>

                  {/* Avg accuracy */}
                  <td className="px-6 py-4 border-b border-border-2">
                    <AccuracyBar accuracy={student.avg_accuracy} />
                  </td>

                  {/* Weakest topic */}
                  <td className="px-6 py-4 border-b border-border-2 whitespace-nowrap">
                    <span className="text-[12px] font-semibold text-muted">
                      {student.weakest_topic_accuracy > 0
                        ? `${student.weakest_topic} · ${student.weakest_topic_accuracy}%`
                        : '—'}
                    </span>
                  </td>

                  {/* Last active */}
                  <td className="px-6 py-4 border-b border-border-2 whitespace-nowrap">
                    <span className="text-[12px] font-medium text-muted">{student.last_active}</span>
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 border-b border-border-2 text-right">
                    <motion.button
                      {...scaleTap}
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewStudent(student.id);
                      }}
                      className="text-[11px] font-bold border border-border-2 bg-bg-0 text-ink px-3 py-1.5 rounded-[16px] group-hover:bg-ink group-hover:text-white transition-colors whitespace-nowrap"
                    >
                      View
                    </motion.button>
                  </td>
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-bg-1/30 text-[11px] font-medium text-muted">
        Showing {filtered.length} of {students.length} · Click any row to view details
      </div>
    </div>
  );
}
