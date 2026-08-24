'use client';

import { useState } from 'react';
import { Trash2, Merge, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { deleteSubject, mergeSubjects } from '@/lib/api/admin';

interface SubjectManagementPanelProps {
  subjects: string[];
  onSubjectsChanged: () => void; // refresh parent data
}

type Toast = { type: 'success' | 'error'; message: string } | null;

export function SubjectManagementPanel({ subjects, onSubjectsChanged }: SubjectManagementPanelProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);
  const [mergeSource, setMergeSource] = useState('');
  const [mergeTarget, setMergeTarget] = useState('');
  const [toast, setToast] = useState<Toast>(null);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleDelete(name: string) {
    if (confirmDelete !== name) {
      setConfirmDelete(name);
      return;
    }
    setDeleting(name);
    setConfirmDelete(null);
    try {
      const res = await deleteSubject(name);
      showToast('success', res.message);
      onSubjectsChanged();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed to delete subject');
    } finally {
      setDeleting(null);
    }
  }

  async function handleMerge() {
    if (!mergeSource || !mergeTarget || mergeSource === mergeTarget) return;
    setMerging(true);
    try {
      const res = await mergeSubjects(mergeSource, mergeTarget);
      showToast('success', res.message);
      setMergeSource('');
      setMergeTarget('');
      onSubjectsChanged();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed to merge subjects');
    } finally {
      setMerging(false);
    }
  }

  return (
    <div className="bg-card border border-border-2 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-2 bg-bg-0">
        <h3 className="text-[13px] font-bold uppercase tracking-widest text-muted">
          Subject Management
        </h3>
        <span className="text-[11px] text-muted font-medium bg-bg-2 rounded-full px-2.5 py-0.5">
          {subjects.length} subjects
        </span>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`flex items-center gap-2 px-5 py-2.5 text-[12px] font-medium border-b ${
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

      {/* Merge subjects */}
      <div className="px-5 py-4 border-b border-border-2 bg-amber-50/50">
        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-2 flex items-center gap-1.5">
          <Merge size={12} />
          Merge Duplicate Subjects
        </p>
        <p className="text-[11px] text-muted mb-3">
          Use this to combine two subjects (e.g. &ldquo;English&rdquo; → &ldquo;English Language&rdquo;).
          The source subject&apos;s chapters and topics are deleted; its class‑level rows are renamed.
        </p>
        <div className="flex flex-wrap gap-2">
          <select
            value={mergeSource}
            onChange={(e) => setMergeSource(e.target.value)}
            className="text-[12px] bg-white border border-border-2 rounded-lg px-3 py-1.5 text-ink outline-none focus:border-ink"
          >
            <option value="">From (source)</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="self-center text-[12px] text-muted font-medium">→ into →</span>
          <select
            value={mergeTarget}
            onChange={(e) => setMergeTarget(e.target.value)}
            className="text-[12px] bg-white border border-border-2 rounded-lg px-3 py-1.5 text-ink outline-none focus:border-ink"
          >
            <option value="">To (target/keep)</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={handleMerge}
            disabled={merging || !mergeSource || !mergeTarget || mergeSource === mergeTarget}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 text-white text-[12px] font-semibold rounded-lg disabled:opacity-40 hover:bg-amber-700 transition-colors"
          >
            {merging ? <Loader2 size={13} className="animate-spin" /> : <Merge size={13} />}
            Merge
          </button>
        </div>
      </div>

      {/* Subject list */}
      <div className="divide-y divide-border-2">
        {subjects.length === 0 && (
          <p className="text-[13px] text-muted text-center py-8">No subjects found.</p>
        )}
        {subjects.map((name) => (
          <div
            key={name}
            className="flex items-center justify-between px-5 py-3 hover:bg-bg-0 transition-colors"
          >
            <span className="text-[13px] font-medium text-ink">{name}</span>

            {confirmDelete === name ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-red-600 font-semibold">
                  Delete all chapters &amp; topics?
                </span>
                <button
                  onClick={() => handleDelete(name)}
                  disabled={deleting === name}
                  className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-[11px] font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting === name ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : null}
                  Yes, Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-3 py-1 border border-border-2 text-[11px] font-semibold text-muted rounded-lg hover:border-ink transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleDelete(name)}
                disabled={!!deleting}
                title={`Delete ${name}`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-red-600 border border-red-100 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-40"
              >
                <Trash2 size={13} />
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
