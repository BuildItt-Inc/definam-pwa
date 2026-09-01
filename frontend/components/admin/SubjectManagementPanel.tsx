'use client';

import { useEffect, useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Eye,
  RotateCw,
  X,
  BookOpen,
  Layers,
} from 'lucide-react';
import {
  getAdminSubjects,
  getSubjectDetail,
  regenerateSubjectCurriculum,
  deleteSubject,
} from '@/lib/api/admin';
import type { AdminSubjectItem, SubjectDetail } from '@/types/admin';

type Toast = { type: 'success' | 'error'; message: string } | null;

export function SubjectManagementPanel() {
  const [subjects, setSubjects] = useState<AdminSubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  // Drill-down view modal state
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [subjectDetail, setSubjectDetail] = useState<SubjectDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function loadSubjects() {
    setLoading(true);
    try {
      const data = await getAdminSubjects();
      setSubjects(data);
    } catch (e: unknown) {
      showToast(
        'error',
        e instanceof Error ? e.message : 'Failed to load subjects'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubjects();
  }, []);

  async function handleView(subjectName: string) {
    setSelectedSubject(subjectName);
    setLoadingDetail(true);
    try {
      const detail = await getSubjectDetail(subjectName);
      setSubjectDetail(detail);
    } catch (e: unknown) {
      showToast(
        'error',
        e instanceof Error ? e.message : 'Failed to load subject details'
      );
      setSelectedSubject(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleRegenerate(subjectName: string) {
    setRegenerating(subjectName);
    try {
      const res = await regenerateSubjectCurriculum(subjectName);
      showToast('success', res.message);
      await loadSubjects();
    } catch (e: unknown) {
      showToast(
        'error',
        e instanceof Error
          ? e.message
          : 'Failed to regenerate subject curriculum'
      );
    } finally {
      setRegenerating(null);
    }
  }

  async function handleDelete(subjectName: string) {
    if (confirmDelete !== subjectName) {
      setConfirmDelete(subjectName);
      return;
    }
    setDeleting(subjectName);
    setConfirmDelete(null);
    try {
      const res = await deleteSubject(subjectName);
      showToast('success', res.message);
      await loadSubjects();
    } catch (e: unknown) {
      showToast(
        'error',
        e instanceof Error ? e.message : 'Failed to delete subject'
      );
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="bg-card border border-border-2 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-2 bg-bg-0">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-ink" />
          <h3 className="text-[13px] font-extrabold uppercase tracking-widest text-ink">
            All Subjects Management
          </h3>
        </div>
        <span className="text-[11px] font-bold text-muted bg-bg-2 rounded-full px-3 py-1">
          {subjects.length} Subjects Total
        </span>
      </div>

      {/* Toast alert */}
      {toast && (
        <div
          className={`flex items-center gap-2 px-5 py-2.5 text-[12px] font-semibold border-b ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
              : 'bg-red-50 text-red-800 border-red-100'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle size={14} strokeWidth={2.5} />
          ) : (
            <AlertTriangle size={14} strokeWidth={2.5} />
          )}
          {toast.message}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center p-8 gap-2 text-muted text-[13px]">
          <Loader2 size={16} className="animate-spin" />
          <span>Loading subjects...</span>
        </div>
      ) : (
        /* Table of subjects */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-0 border-b border-border-2 text-[10px] font-bold uppercase tracking-wider text-muted">
                <th className="px-5 py-3">Subject Name</th>
                <th className="px-4 py-3">Class Levels</th>
                <th className="px-4 py-3">Chapters</th>
                <th className="px-4 py-3">Topics</th>
                <th className="px-4 py-3">Syllabus Ingested</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-2 text-[12px]">
              {subjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-8 text-muted text-[13px]"
                  >
                    No subjects found in system.
                  </td>
                </tr>
              ) : (
                subjects.map((sub) => (
                  <tr
                    key={sub.name}
                    className="hover:bg-bg-0/60 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-bold text-ink">
                      {sub.name}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {sub.class_levels.map((lvl) => (
                          <span
                            key={lvl}
                            className="px-2 py-0.5 bg-bg-2 border border-border-2 rounded text-[10px] font-bold text-ink"
                          >
                            {lvl}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-ink">
                      {sub.chapter_count}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-ink">
                      {sub.topic_count}
                    </td>
                    <td className="px-4 py-3.5">
                      {sub.syllabus_chunks > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle size={10} />
                          {sub.syllabus_chunks} chunks
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-muted bg-bg-1 px-2.5 py-0.5 rounded-full border border-border-2">
                          Not ingested
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View action */}
                        <button
                          onClick={() => handleView(sub.name)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold border border-border-2 rounded-lg hover:bg-bg-2 transition-colors text-ink"
                          title={`View chapters & topics for ${sub.name}`}
                        >
                          <Eye size={12} />
                          View
                        </button>

                        {/* Regenerate action */}
                        <button
                          onClick={() => handleRegenerate(sub.name)}
                          disabled={regenerating === sub.name}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold border border-amber-200 text-amber-800 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                          title={`Regenerate curriculum for ${sub.name}`}
                        >
                          {regenerating === sub.name ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <RotateCw size={12} />
                          )}
                          Regenerate
                        </button>

                        {/* Delete action */}
                        {confirmDelete === sub.name ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDelete(sub.name)}
                              disabled={deleting === sub.name}
                              className="flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white text-[11px] font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {deleting === sub.name ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : null}
                              Confirm Delete
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-2 py-1 border border-border-2 text-[11px] font-semibold text-muted rounded-lg hover:bg-bg-2"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDelete(sub.name)}
                            disabled={!!deleting}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-red-600 border border-red-200 bg-red-50/50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-40"
                            title={`Delete ${sub.name}`}
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Drill-down Subject Detail Modal */}
      {selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
          <div className="bg-card border border-border-2 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-2 bg-bg-0">
              <div className="flex items-center gap-2.5">
                <Layers size={18} className="text-ink" />
                <div>
                  <h2 className="text-[15px] font-extrabold text-ink leading-tight">
                    {selectedSubject}
                  </h2>
                  <p className="text-[11px] text-muted font-medium">
                    Curriculum Structure &amp; Chapters
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubject(null)}
                className="p-1 rounded-lg text-muted hover:text-ink hover:bg-bg-2 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12 gap-2 text-muted text-[13px]">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Loading curriculum hierarchy...</span>
                </div>
              ) : subjectDetail ? (
                subjectDetail.chapters.length === 0 ? (
                  <p className="text-[13px] text-muted text-center py-8">
                    No chapters or topics generated for this subject yet.
                  </p>
                ) : (
                  subjectDetail.chapters.map((ch) => (
                    <div
                      key={ch.id}
                      className="border border-border-2 rounded-xl overflow-hidden bg-bg-0/50"
                    >
                      <div className="flex items-center justify-between px-4 py-2.5 bg-bg-1 border-b border-border-2">
                        <span className="text-[12px] font-bold text-ink">
                          Chapter {ch.chapter_num}: {ch.title}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted bg-bg-2 px-2 py-0.5 rounded">
                          {ch.class_level}
                        </span>
                      </div>
                      <div className="p-3 space-y-1.5">
                        {ch.topics.length === 0 ? (
                          <p className="text-[11px] text-muted italic px-2">
                            No topics in this chapter.
                          </p>
                        ) : (
                          ch.topics.map((top) => (
                            <div
                              key={top.id}
                              className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-card border border-border-2 text-[12px]"
                            >
                              <span className="font-medium text-ink">
                                {top.title}
                              </span>
                              <span
                                className={`text-[10px] font-bold capitalize px-2 py-0.5 rounded ${
                                  top.status === 'published'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {top.status}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )
              ) : (
                <p className="text-[13px] text-muted text-center py-8">
                  Failed to load subject details.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
