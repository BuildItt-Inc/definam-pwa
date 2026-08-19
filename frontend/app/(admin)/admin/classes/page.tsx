'use client';

import { useEffect, useState } from 'react';
import { School, Plus, Trash2, ArrowLeft, Users, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scaleTap } from '@/lib/motion';
import {
  getClasses,
  createClass,
  deleteClass,
  getAdminDashboard,
  assignStudentsToClass,
  removeStudentsFromClass,
} from '@/lib/api/admin';
import type { SchoolClass, StudentRow } from '@/types/admin';

// ── Loading Skeleton ────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      <div className="bg-card border-b border-border-2 px-5 py-[10px] flex items-center">
        <div className="h-4 w-44 bg-bg-3 rounded" />
      </div>
      <div className="flex-1 p-5 bg-bg-0 space-y-5">
        <div className="h-28 bg-bg-2 border border-border-2 rounded-[24px]" />
        <div className="bg-card border border-border-2 rounded-[24px] overflow-hidden">
          <div className="px-6 py-4 border-b border-border-2 h-12 bg-bg-1/50" />
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-bg-2 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [allStudents, setAllStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [newClassName, setNewClassName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Manage state
  const [managingClass, setManagingClass] = useState<SchoolClass | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [updatingStudents, setUpdatingStudents] = useState(false);

  // Load data
  async function loadData() {
    try {
      const [classesData, dashboardData] = await Promise.all([
        getClasses(),
        getAdminDashboard(),
      ]);
      setClasses(classesData);
      setAllStudents(dashboardData.students);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load class data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await createClass(newClassName.trim());
      setNewClassName('');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create class.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteClass(classId: string) {
    if (!confirm('Are you sure you want to delete this class? Students in this class will not be deleted but will have their class setting removed.')) {
      return;
    }
    setDeletingId(classId);
    setError(null);
    try {
      await deleteClass(classId);
      // If currently managing this class, return to main view
      if (managingClass?.id === classId) {
        setManagingClass(null);
      }
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete class.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAssignStudents() {
    if (!managingClass || selectedStudentIds.length === 0) return;
    setUpdatingStudents(true);
    setError(null);
    try {
      await assignStudentsToClass(managingClass.id, selectedStudentIds);
      setSelectedStudentIds([]);
      await loadData();
      // Update the managing class state to reflect student count
      const updatedClass = classes.find((c) => c.id === managingClass.id);
      if (updatedClass) {
        setManagingClass({
          ...managingClass,
          student_count: (updatedClass.student_count || 0) + selectedStudentIds.length,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to assign students.');
    } finally {
      setUpdatingStudents(false);
    }
  }

  async function handleRemoveStudent(studentId: string) {
    if (!managingClass) return;
    setError(null);
    try {
      await removeStudentsFromClass(managingClass.id, [studentId]);
      await loadData();
      // Update the managing class state
      if (managingClass.student_count && managingClass.student_count > 0) {
        setManagingClass({
          ...managingClass,
          student_count: managingClass.student_count - 1,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove student.');
    }
  }

  function toggleStudentSelection(studentId: string) {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  }

  if (loading) return <LoadingSkeleton />;

  // Filter students based on managing status
  const currentClassStudents = managingClass
    ? allStudents.filter((s) => s.class_id === managingClass.id)
    : [];

  const unassignedStudents = managingClass
    ? allStudents.filter((s) => !s.class_id)
    : [];

  return (
    <div className="flex flex-col h-full bg-bg-0">
      {/* Top bar */}
      <div className="bg-card border-b border-border-2 px-5 py-[10px] flex items-center shrink-0">
        <div className="flex items-center gap-3">
          {managingClass && (
            <button
              onClick={() => {
                setManagingClass(null);
                setSelectedStudentIds([]);
              }}
              className="p-1 border border-border-2 hover:border-ink rounded-lg transition-colors"
            >
              <ArrowLeft size={14} className="text-ink" />
            </button>
          )}
          <h1 className="font-bold text-[14px] font-extrabold text-ink leading-tight tracking-tight flex items-center gap-2">
            <School size={16} strokeWidth={2} />
            {managingClass ? `Manage Class: ${managingClass.name}` : 'Class Management'}
          </h1>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {error && (
          <div className="bg-bg-1 border border-danger/40 rounded-lg p-3 text-[12px] font-semibold text-danger flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="p-0.5 hover:bg-bg-2 rounded">
              <X size={14} />
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!managingClass ? (
            <motion.div
              key="list-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Create Class Section */}
              <div className="bg-bg-1 border border-border-2 rounded-[24px] p-5">
                <h2 className="text-[12px] font-extrabold text-ink tracking-tight uppercase mb-3">
                  Create Class
                </h2>
                <form onSubmit={handleCreateClass} className="flex gap-3 max-w-md">
                  <input
                    type="text"
                    placeholder="e.g., SS2A, Grade 10B"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    disabled={creating}
                    className="flex-1 px-4 py-2 border border-border-2 bg-card rounded-[16px] text-[12px] font-semibold text-ink placeholder:text-muted focus:border-ink outline-none transition-colors"
                  />
                  <motion.button
                    {...scaleTap}
                    type="submit"
                    disabled={creating || !newClassName.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-ink text-white text-[11px] font-bold rounded-[16px] hover:bg-ink/90 transition-colors disabled:opacity-60"
                  >
                    <Plus size={13} strokeWidth={2} />
                    {creating ? 'Creating...' : 'Create'}
                  </motion.button>
                </form>
              </div>

              {/* Classes List */}
              <div className="bg-card border border-border-2 rounded-[24px] overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-border-2 bg-bg-1/50 flex items-center justify-between">
                  <span className="text-[14px] font-extrabold text-ink tracking-tight">Active Classes</span>
                  <span className="text-[11px] font-bold text-muted bg-bg-1 border border-border-2 px-2.5 py-0.5 rounded-[12px]">
                    {classes.length} Total
                  </span>
                </div>

                <div className="divide-y divide-border-2">
                  {classes.length === 0 ? (
                    <div className="px-6 py-12 text-center text-[12px] font-medium text-muted">
                      No classes created yet. Use the card above to set up classes.
                    </div>
                  ) : (
                    classes.map((cls) => (
                      <div
                        key={cls.id}
                        className="px-6 py-4 flex items-center justify-between hover:bg-bg-1/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-bg-1 border border-border-2 rounded-[12px] flex items-center justify-center">
                            <School size={16} className="text-ink" />
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-ink">{cls.name}</p>
                            <p className="text-[10px] text-muted font-semibold mt-0.5">
                              {cls.student_count || 0} Student{(cls.student_count || 0) !== 1 ? 's' : ''} assigned
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setManagingClass(cls)}
                            className="text-[11px] font-bold border border-border-2 bg-bg-0 text-ink px-3 py-1.5 rounded-[16px] hover:bg-ink hover:text-white hover:border-ink transition-colors flex items-center gap-1"
                          >
                            <Users size={12} />
                            Manage Students
                          </button>
                          <button
                            onClick={() => handleDeleteClass(cls.id)}
                            disabled={deletingId === cls.id}
                            className="p-1.5 border border-border-2 hover:border-danger hover:text-danger rounded-lg transition-colors text-muted"
                          >
                            <Trash2 size={13} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="manage-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-5"
            >
              {/* Left Column: Assigned Students */}
              <div className="bg-card border border-border-2 rounded-[24px] overflow-hidden flex flex-col min-h-[400px]">
                <div className="px-6 py-4 border-b border-border-2 bg-bg-1/50 flex items-center justify-between">
                  <h3 className="text-[13px] font-extrabold text-ink tracking-tight flex items-center gap-2">
                    <Users size={14} />
                    Assigned Students ({currentClassStudents.length})
                  </h3>
                </div>

                <div className="divide-y divide-border-2 flex-1 overflow-y-auto max-h-[500px]">
                  {currentClassStudents.length === 0 ? (
                    <div className="p-12 text-center text-[12px] font-medium text-muted">
                      No students assigned to this class yet. Select unassigned students on the right to assign them.
                    </div>
                  ) : (
                    currentClassStudents.map((student) => (
                      <div key={student.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-bg-1/30 transition-colors">
                        <div>
                          <p className="text-[12px] font-bold text-ink">{student.name}</p>
                          <p className="text-[10px] text-muted font-semibold mt-0.5">
                            Accuracy: {student.avg_accuracy}% · Streak: {student.streak_days}d
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveStudent(student.id)}
                          className="text-[10px] font-bold text-muted hover:text-danger border border-border-2 hover:border-danger rounded-[12px] px-2.5 py-1 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Unassigned Students to Assign */}
              <div className="bg-card border border-border-2 rounded-[24px] overflow-hidden flex flex-col min-h-[400px]">
                <div className="px-6 py-4 border-b border-border-2 bg-bg-1/50 flex items-center justify-between">
                  <h3 className="text-[13px] font-extrabold text-ink tracking-tight">
                    Unassigned Students ({unassignedStudents.length})
                  </h3>
                  {selectedStudentIds.length > 0 && (
                    <motion.button
                      {...scaleTap}
                      onClick={handleAssignStudents}
                      disabled={updatingStudents}
                      className="flex items-center gap-1 px-3 py-1 bg-ink text-white text-[10px] font-extrabold rounded-[12px] hover:bg-ink/90 transition-colors"
                    >
                      <Check size={11} />
                      Assign Selected ({selectedStudentIds.length})
                    </motion.button>
                  )}
                </div>

                <div className="divide-y divide-border-2 flex-1 overflow-y-auto max-h-[500px]">
                  {unassignedStudents.length === 0 ? (
                    <div className="p-12 text-center text-[12px] font-medium text-muted">
                      All students in your school have already been assigned to classes.
                    </div>
                  ) : (
                    unassignedStudents.map((student) => {
                      const isSelected = selectedStudentIds.includes(student.id);
                      return (
                        <div
                          key={student.id}
                          onClick={() => toggleStudentSelection(student.id)}
                          className="px-6 py-3.5 flex items-center gap-3 hover:bg-bg-1/30 transition-colors cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by row onClick
                            className="w-3.5 h-3.5 rounded border-border-2 text-ink focus:ring-ink"
                          />
                          <div>
                            <p className="text-[12px] font-bold text-ink">{student.name}</p>
                            <p className="text-[10px] text-muted font-semibold mt-0.5">
                              Accuracy: {student.avg_accuracy}% · Streak: {student.streak_days}d
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
