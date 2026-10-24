'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Check,
  Plus,
  RotateCcw,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import {
  ALL_CURRICULUM_SUBJECTS,
  type CurriculumSubject,
  type SubjectCategory,
  subjectColor,
} from '@/lib/utils/subjects';
import {
  getStudentProfile,
  saveStudentProfile,
  isSubjectSelected,
  DEFAULT_SUBJECTS,
  type StudentProfile,
} from '@/lib/utils/studentProfile';
import { toast } from '@/lib/toast';

const CATEGORY_TABS: { id: 'all' | SubjectCategory; label: string }[] = [
  { id: 'all', label: 'All Subjects' },
  { id: 'core', label: 'Core' },
  { id: 'science', label: 'Sciences' },
  { id: 'arts', label: 'Arts & Humanities' },
  { id: 'commercial', label: 'Commercial' },
];

export default function ManageSubjectsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | SubjectCategory>('all');
  const [isSaving, setIsSaving] = useState(false);

  // Load profile on mount
  useEffect(() => {
    const existing = getStudentProfile();
    if (existing) {
      setProfile(existing);
      setSelectedSubjects(existing.selectedSubjects && existing.selectedSubjects.length > 0
        ? existing.selectedSubjects
        : DEFAULT_SUBJECTS);
    } else {
      setSelectedSubjects(DEFAULT_SUBJECTS);
    }
  }, []);

  // Sync to local storage & broadcast changes
  const updateSubjects = (newSubjects: string[]) => {
    setSelectedSubjects(newSubjects);
    let base = profile;
    if (!base) {
      base = {
        name: 'Student',
        class_level: 'SS3',
        targets: ['WAEC', 'School exams'],
        selectedSubjects: newSubjects,
        completedOnboarding: true,
      };
    } else {
      base = {
        ...base,
        selectedSubjects: newSubjects,
      };
    }
    setProfile(base);
    saveStudentProfile(base);
  };

  const handleToggle = (subject: CurriculumSubject) => {
    const isSelected = isSubjectSelected(subject.name, selectedSubjects);

    if (isSelected) {
      // Guard: do not allow removing the last remaining subject
      if (selectedSubjects.length <= 1) {
        toast.error('You need at least one subject selected to study.');
        return;
      }

      const updated = selectedSubjects.filter(
        (s) => s.toLowerCase().trim() !== subject.name.toLowerCase().trim()
      );
      updateSubjects(updated);
      toast.info(`Removed ${subject.name}`);
    } else {
      const updated = [...selectedSubjects, subject.name];
      updateSubjects(updated);
      toast.success(`Added ${subject.name} to your curriculum`);
    }
  };

  const handleResetDefaults = () => {
    updateSubjects([...DEFAULT_SUBJECTS]);
    toast.success('Reset to standard curriculum subjects');
  };

  const handleSelectAll = () => {
    const allNames = ALL_CURRICULUM_SUBJECTS.map((s) => s.name);
    updateSubjects(allNames);
    toast.success('All 20 subjects selected');
  };

  // Filtered subjects list
  const filteredSubjects = useMemo(() => {
    const q = query.toLowerCase().trim();
    return ALL_CURRICULUM_SUBJECTS.filter((subject) => {
      const matchesTab = activeTab === 'all' || subject.category === activeTab;
      const matchesQuery =
        !q ||
        subject.name.toLowerCase().includes(q) ||
        subject.categoryLabel.toLowerCase().includes(q) ||
        subject.badge.toLowerCase().includes(q);
      return matchesTab && matchesQuery;
    });
  }, [query, activeTab]);

  const activeCount = selectedSubjects.length;

  const handleDone = () => {
    setIsSaving(true);
    toast.success('Subjects saved successfully');
    setTimeout(() => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push('/student');
      }
    }, 200);
  };

  return (
    <div className="page-with-nav min-h-screen bg-bg-0 text-ink page-enter pb-32">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur-md px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) router.back();
                else router.push('/student');
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-ink hover:bg-bg-1 active:scale-95 transition-all"
              aria-label="Go back"
            >
              <ArrowLeft size={18} strokeWidth={2.2} />
            </button>
            <div>
              <h1 className="text-[17px] font-bold text-ink leading-tight">
                Manage Subjects
              </h1>
              <p className="text-xs text-muted">
                {activeCount} {activeCount === 1 ? 'subject' : 'subjects'} active in your curriculum
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDone}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs active:scale-95 transition-all"
          >
            <Check size={14} strokeWidth={2.5} />
            <span>Done</span>
          </button>
        </div>

        {/* ── Search Input ── */}
        <div className="mt-3">
          <label className="flex items-center gap-2 rounded-xl border border-border bg-bg-1 px-3 py-2 focus-within:border-ink focus-within:bg-white focus-within:ring-1 focus-within:ring-ink/10 transition-all">
            <Search size={15} strokeWidth={2} className="text-muted flex-shrink-0" />
            <input
              type="search"
              placeholder="Search all 20 subjects..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-[14px] text-ink placeholder:text-muted focus:outline-none"
            />
          </label>
        </div>

        {/* ── Category Filter Tabs ── */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {CATEGORY_TABS.map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  isTabActive
                    ? 'bg-ink text-white shadow-2xs'
                    : 'bg-bg-2 text-muted hover:text-ink hover:bg-bg-3'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Main Subject List ── */}
      <main className="px-4 pt-4">
        {/* Banner with helpful hints and shortcuts */}
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded-2xl border border-border bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Sparkles size={16} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs font-bold text-ink">Customize your study plan</p>
              <p className="text-[11px] text-muted">
                Tap any subject to add or remove it from your dashboard & practice queue.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-bg-1 px-2.5 py-1 text-[11px] font-semibold text-muted hover:text-ink active:scale-95 transition-all"
            >
              <RotateCcw size={11} strokeWidth={2} />
              Reset defaults
            </button>
            <button
              type="button"
              onClick={handleSelectAll}
              className="rounded-lg bg-bg-2 px-2.5 py-1 text-[11px] font-semibold text-ink hover:bg-bg-3 active:scale-95 transition-all"
            >
              Select all
            </button>
          </div>
        </div>

        {/* Subjects Grid */}
        {filteredSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
            <BookOpen size={32} className="text-muted/60 mb-2" strokeWidth={1.5} />
            <p className="text-sm font-bold text-ink">No subjects match &quot;{query}&quot;</p>
            <p className="text-xs text-muted mt-1">Try searching for a different subject or clearing your search.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setActiveTab('all');
              }}
              className="mt-3 text-xs font-bold text-brand underline underline-offset-4"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredSubjects.map((subject) => {
              const Icon = subject.icon;
              const color = subjectColor(subject.name);
              const isSelected = isSubjectSelected(subject.name, selectedSubjects);

              return (
                <div
                  key={subject.id}
                  onClick={() => handleToggle(subject)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggle(subject);
                    }
                  }}
                  className={`group relative flex items-center justify-between gap-3 rounded-2xl border p-3 cursor-pointer transition-all active:scale-[0.99] ${
                    isSelected
                      ? 'border-ink/20 bg-white shadow-2xs hover:border-ink/40'
                      : 'border-border bg-white/60 opacity-80 hover:opacity-100 hover:border-border-2 hover:bg-white'
                  }`}
                >
                  {/* Left: Icon + Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                      style={{ backgroundColor: color.bg, color: color.fg }}
                    >
                      <Icon size={20} strokeWidth={2} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-bold text-ink leading-tight">
                          {subject.name}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                        <span className="font-medium">{subject.categoryLabel}</span>
                        <span>·</span>
                        <span className="font-mono text-[11px] font-semibold uppercase text-faint">
                          {subject.badge}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Toggle Button */}
                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-ink px-3 py-1.5 text-xs font-bold text-white shadow-2xs group-hover:bg-neutral-800 transition-colors">
                        <Check size={13} strokeWidth={3} />
                        <span>Added</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-xl border border-border bg-bg-1 px-3 py-1.5 text-xs font-semibold text-muted group-hover:border-ink/30 group-hover:text-ink transition-colors">
                        <Plus size={13} strokeWidth={2.2} />
                        <span>Add</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Fixed Floating Bottom Bar ── */}
      <div className="fixed bottom-[60px] left-0 right-0 z-30 px-4 pointer-events-none">
        <div className="mx-auto max-w-lg pointer-events-auto flex items-center justify-between rounded-2xl border border-ink/10 bg-white/95 backdrop-blur-md p-3 shadow-lg">
          <div className="min-w-0">
            <p className="text-xs font-bold text-ink truncate">
              {activeCount} of {ALL_CURRICULUM_SUBJECTS.length} subjects active
            </p>
            <p className="text-[11px] text-muted truncate">
              {activeCount >= 4 ? 'Great study balance!' : 'Select your primary exam subjects'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleDone}
            className="flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white shadow-xs active:scale-95 transition-transform"
          >
            <span>Save & Done</span>
            <Check size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
