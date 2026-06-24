'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Flame, ChevronDown } from 'lucide-react';
import type { StudentRow } from '@/types/admin';

interface ClassTableProps {
  students: StudentRow[];
  activeSubjects: string[];
  onViewStudent: (studentId: string) => void;
}

function AccuracyBar({ accuracy }: { accuracy: number }) {
  const fillColor =
    accuracy >= 60 ? 'bg-jade' : accuracy >= 40 ? 'bg-gold' : 'bg-coral';
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1 bg-gray-100 border border-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${fillColor} rounded-full`}
          style={{ width: `${accuracy}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold text-gray-700">{accuracy}%</span>
    </div>
  );
}

function RecallBadge({ status, overdueDays }: { status: StudentRow['recall_status']; overdueDays: number }) {
  if (status === 'on_track') {
    return (
      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-sm bg-jade text-white border border-jade">
        On Track
      </span>
    );
  }
  if (status === 'overdue') {
    return (
      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-sm bg-gold text-white border border-gold">
        {overdueDays} {overdueDays === 1 ? 'Day' : 'Days'} Overdue
      </span>
    );
  }
  return (
    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-sm bg-transparent text-gray-500 border border-gray-300">
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
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Table header bar */}
      <div className="flex items-center gap-3 px-4 py-[10px] border-b border-gray-200">
        <span className="text-[13px] font-extrabold text-ink">All Students — SS2A</span>
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="flex items-center gap-1.5 border border-gray-200 bg-gray-50 rounded-md px-2.5 py-[5px]">
            <Search size={12} className="text-gray-400 shrink-0" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-[11px] text-gray-600 bg-transparent outline-none w-36 placeholder:text-gray-400"
            />
          </div>

          {/* Subject filter */}
          <div className="relative flex items-center border border-gray-200 bg-gray-50 rounded-md px-2.5 py-[5px] gap-1.5">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-[11px] text-gray-600 bg-transparent outline-none appearance-none pr-4 cursor-pointer"
            >
              <option value="All Subjects">All Subjects</option>
              {activeSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown
              size={11}
              className="text-gray-400 pointer-events-none absolute right-2"
              strokeWidth={1.5}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-[7px] text-[10px] font-bold uppercase tracking-[0.06em] text-gray-400 border-b border-gray-200 whitespace-nowrap">
                Student
              </th>
              <th className="px-4 py-[7px] text-[10px] font-bold uppercase tracking-[0.06em] text-gray-400 border-b border-gray-200 whitespace-nowrap">
                Streak
              </th>
              <th className="px-4 py-[7px] text-[10px] font-bold uppercase tracking-[0.06em] text-gray-400 border-b border-gray-200 whitespace-nowrap">
                Recall Status
              </th>
              <th className="px-4 py-[7px] text-[10px] font-bold uppercase tracking-[0.06em] text-gray-400 border-b border-gray-200 whitespace-nowrap">
                Avg Accuracy
              </th>
              <th className="px-4 py-[7px] text-[10px] font-bold uppercase tracking-[0.06em] text-gray-400 border-b border-gray-200 whitespace-nowrap">
                Weakest Topic
              </th>
              <th className="px-4 py-[7px] text-[10px] font-bold uppercase tracking-[0.06em] text-gray-400 border-b border-gray-200 whitespace-nowrap">
                Last Active
              </th>
              <th className="px-4 py-[7px] border-b border-gray-200" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-[12px] text-gray-400"
                >
                  No students match your filters.
                </td>
              </tr>
            )}
            {filtered.map((student, idx) => {
              const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60';
              return (
                <tr
                  key={student.id}
                  className={`${rowBg} hover:bg-[#EAF3DE] transition-colors group`}
                >
                  {/* Name */}
                  <td className="px-4 py-[9px] border-b border-gray-100">
                    <span className="text-[12px] font-bold text-ink">
                      {student.name}
                    </span>
                  </td>

                  {/* Streak */}
                  <td className="px-4 py-[9px] border-b border-gray-100 whitespace-nowrap">
                    {student.streak_days > 0 ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-700">
                        <Flame size={13} className="text-gold" strokeWidth={1.5} />
                        {student.streak_days} days
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-300">— no streak</span>
                    )}
                  </td>

                  {/* Recall status */}
                  <td className="px-4 py-[9px] border-b border-gray-100">
                    <RecallBadge
                      status={student.recall_status}
                      overdueDays={student.overdue_days}
                    />
                  </td>

                  {/* Avg accuracy */}
                  <td className="px-4 py-[9px] border-b border-gray-100">
                    <AccuracyBar accuracy={student.avg_accuracy} />
                  </td>

                  {/* Weakest topic */}
                  <td className="px-4 py-[9px] border-b border-gray-100 whitespace-nowrap">
                    <span className="text-[11px] text-gray-500">
                      {student.weakest_topic_accuracy > 0
                        ? `${student.weakest_topic} · ${student.weakest_topic_accuracy}%`
                        : '— No data'}
                    </span>
                  </td>

                  {/* Last active */}
                  <td className="px-4 py-[9px] border-b border-gray-100 whitespace-nowrap">
                    <span className="text-[11px] text-gray-400">{student.last_active}</span>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-[9px] border-b border-gray-100">
                    <button
                      onClick={() => onViewStudent(student.id)}
                      className="text-[10px] font-bold border border-gray-200 bg-white px-2.5 py-1 rounded-md hover:border-jade hover:text-jade transition-colors whitespace-nowrap"
                    >
                      View →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-100 text-[10px] text-gray-400">
        Showing {filtered.length} of {students.length} · Click any row to open
        Student Drill-Down
      </div>
    </div>
  );
}
