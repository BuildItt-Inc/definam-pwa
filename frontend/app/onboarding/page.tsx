'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Check, ArrowRight } from 'lucide-react';
import { getStudentProfile, saveStudentProfile, type StudentProfile } from '@/lib/utils/studentProfile';
import { getMe } from '@/lib/api/auth';

interface SubjectItem {
  id: string;
  name: string;
  badge: string;
  badgeBg: string;
  badgeFg: string;
}

const EVERYONE_SUBJECTS: SubjectItem[] = [
  { id: 'en', name: 'English Language', badge: 'En', badgeBg: '#f3e8ff', badgeFg: '#7e22ce' },
  { id: 'ma', name: 'Mathematics', badge: 'Ma', badgeBg: '#dbeafe', badgeFg: '#1d4ed8' },
];

const SCIENCE_SUBJECTS: SubjectItem[] = [
  { id: 'ph', name: 'Physics', badge: 'Ph', badgeBg: '#ffedd5', badgeFg: '#c2410c' },
  { id: 'ch', name: 'Chemistry', badge: 'Ch', badgeBg: '#cffafe', badgeFg: '#0e7490' },
  { id: 'bi', name: 'Biology', badge: 'Bi', badgeBg: '#dcfce7', badgeFg: '#15803d' },
  { id: 'fm', name: 'Further Mathematics', badge: 'Fm', badgeBg: '#e0e7ff', badgeFg: '#4338ca' },
  { id: 'ag', name: 'Agricultural Science', badge: 'Ag', badgeBg: '#ecfdf5', badgeFg: '#047857' },
  { id: 'td', name: 'Technical Drawing', badge: 'Td', badgeBg: '#f1f5f9', badgeFg: '#334155' },
];

const ARTS_SUBJECTS: SubjectItem[] = [
  { id: 'li', name: 'Literature in English', badge: 'Li', badgeBg: '#ede9fe', badgeFg: '#6d28d9' },
  { id: 'ec', name: 'Economics', badge: 'Ec', badgeBg: '#fce7f3', badgeFg: '#be185d' },
  { id: 'gv', name: 'Government', badge: 'Gv', badgeBg: '#ffe4e6', badgeFg: '#e11d48' },
  { id: 'fn', name: 'Food and Nutrition', badge: 'Fn', badgeBg: '#d1fae5', badgeFg: '#065f46' },
];

const MORE_SUBJECTS: SubjectItem[] = [
  { id: 'cm', name: 'Commerce', badge: 'Cm', badgeBg: '#fef3c7', badgeFg: '#b45309' },
  { id: 'ac', name: 'Financial Accounting', badge: 'Ac', badgeBg: '#e0f2fe', badgeFg: '#0369a1' },
  { id: 'ce', name: 'Civic Education', badge: 'Ce', badgeBg: '#ede9fe', badgeFg: '#5b21b6' },
  { id: 'cr', name: 'Christian Religious Studies', badge: 'Cr', badgeBg: '#e0e7ff', badgeFg: '#3730a3' },
  { id: 'ir', name: 'Islamic Studies', badge: 'Ir', badgeBg: '#dcfce7', badgeFg: '#166534' },
  { id: 'gg', name: 'Geography', badge: 'Gg', badgeBg: '#fed7aa', badgeFg: '#9a3412' },
  { id: 'cs', name: 'Computer Studies', badge: 'Cs', badgeBg: '#ccfbf1', badgeFg: '#0f766e' },
  { id: 'dp', name: 'Data Processing', badge: 'Dp', badgeBg: '#f1f5f9', badgeFg: '#475569' },
];

type ClassOption = 'SS1' | 'SS2' | 'SS3' | 'Finished school';
const CLASS_OPTIONS: ClassOption[] = ['SS1', 'SS2', 'SS3', 'Finished school'];

const EXAM_OPTIONS = ['WAEC', 'NECO', 'JAMB', 'School exams'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 state
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassOption>('SS3');
  const [selectedTargets, setSelectedTargets] = useState<string[]>(['WAEC', 'School exams']);

  // Step 2 state
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    'English Language',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Literature in English',
    'Economics',
  ]);
  const [showMoreSubjects, setShowMoreSubjects] = useState(false);

  // Load existing profile or current user details if available
  useEffect(() => {
    const existing = getStudentProfile();
    if (existing) {
      if (existing.name) setName(existing.name);
      if (existing.class_level) setSelectedClass(existing.class_level);
      if (existing.targets && existing.targets.length > 0) setSelectedTargets(existing.targets);
      if (existing.selectedSubjects && existing.selectedSubjects.length > 0) {
        setSelectedSubjects(existing.selectedSubjects);
      }
    } else {
      // Try fetching current student name from /api/v1/auth/me
      getMe()
        .then((me) => {
          if (me?.name) {
            setName((prev) => prev || me.name || '');
          } else if (me?.username) {
            setName((prev) => prev || me.username || '');
          }
        })
        .catch(() => {});
    }
  }, []);

  const toggleTarget = (target: string) => {
    setSelectedTargets((prev) =>
      prev.includes(target) ? prev.filter((t) => t !== target) : [...prev, target]
    );
  };

  const toggleSubject = (subjectName: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectName) ? prev.filter((s) => s !== subjectName) : [...prev, subjectName]
    );
  };

  const handleFinishOnboarding = () => {
    const profile: StudentProfile = {
      name: name.trim() || 'Student',
      class_level: selectedClass,
      targets: selectedTargets,
      selectedSubjects,
      completedOnboarding: true,
    };
    saveStudentProfile(profile);
    router.push('/student');
  };

  return (
    <div className="min-h-screen bg-[#fafbfa] flex flex-col justify-between px-4 py-6 sm:py-10">
      <div className="w-full max-w-[420px] mx-auto flex-1 flex flex-col">
        {/* Progress header */}
        <div className="mb-6">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              aria-label="Go back"
              className="text-ink -ml-1.5 mb-2.5 p-1 text-ink/80 hover:text-ink active:scale-95 transition-all inline-flex items-center"
            >
              <ChevronLeft size={24} strokeWidth={2} />
            </button>
          )}

          {/* 3-segment progress indicator bar */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className={`h-1.5 rounded-full transition-colors ${step >= 1 ? 'bg-[#15803d]' : 'bg-gray-200'}`} />
            <div className={`h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-[#15803d]' : 'bg-gray-200'}`} />
            <div className={`h-1.5 rounded-full transition-colors ${step >= 3 ? 'bg-[#15803d]' : 'bg-gray-200'}`} />
          </div>

          <p className="text-[12.5px] font-semibold text-gray-500">
            Step {step} of 3
          </p>
        </div>

        {/* ── STEP 1: Let's set you up ────────────────────────────────────── */}
        {step === 1 && (
          <div className="flex-1 flex flex-col">
            <h1 className="text-[28px] sm:text-[30px] font-bold text-ink tracking-tight mb-1 leading-tight">
              Let&apos;s set you up
            </h1>
            <p className="text-[14.5px] text-muted mb-6 leading-relaxed">
              One minute. You can change all of this later.
            </p>

            <div className="space-y-6 flex-1">
              {/* Question 1: Name */}
              <div>
                <label htmlFor="student_name" className="block text-[14px] font-bold text-ink mb-1.5">
                  What should we call you?
                </label>
                <input
                  id="student_name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Francis"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[16px] sm:text-[15px] font-medium text-ink placeholder:text-gray-400 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none transition-all touch-manipulation"
                />
              </div>

              {/* Question 2: Class */}
              <div>
                <p className="text-[14px] font-bold text-ink mb-2">
                  Which class are you in?
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {CLASS_OPTIONS.map((c) => {
                    const isSelected = selectedClass === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedClass(c)}
                        className={`rounded-xl p-3.5 text-[14.5px] font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'border-2 border-[#15803d] bg-white text-[#15803d] shadow-2xs'
                            : 'border border-gray-300 bg-white text-ink hover:border-gray-400 active:scale-[0.98]'
                        }`}
                      >
                        {isSelected && <Check size={16} strokeWidth={3} className="text-[#15803d]" />}
                        <span>{c}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question 3: Targets */}
              <div>
                <p className="text-[14px] font-bold text-ink mb-2">
                  What are you preparing for? <span className="font-normal text-gray-500 text-[13px]">(pick any)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXAM_OPTIONS.map((target) => {
                    const isSelected = selectedTargets.includes(target);
                    return (
                      <button
                        key={target}
                        type="button"
                        onClick={() => toggleTarget(target)}
                        className={`rounded-full px-4 py-2 text-[13.5px] font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                          isSelected
                            ? 'bg-[#15803d] text-white shadow-xs'
                            : 'bg-white border border-gray-300 text-ink hover:border-gray-400'
                        }`}
                      >
                        {isSelected && <Check size={14} strokeWidth={3} />}
                        <span>{target}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full rounded-xl bg-[#15803d] hover:bg-[#166534] py-3.5 text-[15.5px] font-bold text-white shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight size={17} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Pick your subjects ──────────────────────────────────── */}
        {step === 2 && (
          <div className="flex-1 flex flex-col pb-16">
            <h1 className="text-[28px] sm:text-[30px] font-bold text-ink tracking-tight mb-1 leading-tight">
              Pick your subjects
            </h1>
            <p className="text-[14px] text-muted mb-6 leading-relaxed">
              Choose the ones you&apos;re writing. WAEC candidates usually write 8 or 9. You can change this anytime.
            </p>

            <div className="space-y-6">
              {/* Category 1: Everyone Writes */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
                  Everyone Writes
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {EVERYONE_SUBJECTS.map((subj) => (
                    <SubjectToggleCard
                      key={subj.id}
                      item={subj}
                      selected={selectedSubjects.includes(subj.name)}
                      onToggle={() => toggleSubject(subj.name)}
                    />
                  ))}
                </div>
              </div>

              {/* Category 2: Sciences */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
                  Sciences
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {SCIENCE_SUBJECTS.map((subj) => (
                    <SubjectToggleCard
                      key={subj.id}
                      item={subj}
                      selected={selectedSubjects.includes(subj.name)}
                      onToggle={() => toggleSubject(subj.name)}
                    />
                  ))}
                </div>
              </div>

              {/* Category 3: Arts and Social Sciences */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
                  Arts and Social Sciences
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {ARTS_SUBJECTS.map((subj) => (
                    <SubjectToggleCard
                      key={subj.id}
                      item={subj}
                      selected={selectedSubjects.includes(subj.name)}
                      onToggle={() => toggleSubject(subj.name)}
                    />
                  ))}
                </div>
              </div>

              {/* Expandable Additional Subjects */}
              {showMoreSubjects ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
                    Other Subjects
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {MORE_SUBJECTS.map((subj) => (
                      <SubjectToggleCard
                        key={subj.id}
                        item={subj}
                        selected={selectedSubjects.includes(subj.name)}
                        onToggle={() => toggleSubject(subj.name)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMoreSubjects(true)}
                    className="text-[14px] font-bold text-brand underline underline-offset-4 hover:text-brand-dark transition-colors"
                  >
                    Show 8 more subjects
                  </button>
                </div>
              )}
            </div>

            {/* Sticky bottom bar matching mockup */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 pb-safe">
              <div className="max-w-[420px] mx-auto flex items-center justify-between gap-3">
                <div>
                  <span className="text-[17px] font-bold text-ink">
                    {selectedSubjects.length}
                  </span>{' '}
                  <span className="text-[13px] text-gray-500">
                    subjects selected
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={selectedSubjects.length === 0}
                  className="rounded-xl bg-[#15803d] hover:bg-[#166534] px-6 py-2.5 text-[14.5px] font-bold text-white shadow-sm active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>Continue</span>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: You're all set! ────────────────────────────────────── */}
        {step === 3 && (
          <div className="flex-1 flex flex-col">
            <h1 className="text-[28px] sm:text-[30px] font-bold text-ink tracking-tight mb-1 leading-tight">
              You&apos;re all set{name ? `, ${name}` : ''}!
            </h1>
            <p className="text-[14.5px] text-muted mb-6 leading-relaxed">
              Your personalized curriculum is configured for your class and selected subjects.
            </p>

            <div className="space-y-4 flex-1">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Class Level</span>
                  <span className="font-bold text-ink text-[14px]">{selectedClass}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Target Exams</span>
                  <span className="font-bold text-ink text-[14px]">{selectedTargets.join(', ')}</span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">My Selected Subjects</span>
                    <span className="font-bold text-brand text-xs">{selectedSubjects.length} subjects</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSubjects.map((s) => (
                      <span
                        key={s}
                        className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-[#ecfdf5] border border-emerald-200/70 p-3.5 text-[13px] text-emerald-900 leading-relaxed">
                <p className="font-bold text-emerald-950 mb-0.5">Customized student experience</p>
                Only your selected subjects will appear on your study dashboard. You can modify your subjects anytime.
              </div>
            </div>

            <div className="mt-8 pt-4">
              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="w-full rounded-xl bg-[#15803d] hover:bg-[#166534] py-3.5 text-[15.5px] font-bold text-white shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <span>Start learning</span>
                <ArrowRight size={17} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SubjectToggleCard({
  item,
  selected,
  onToggle,
}: {
  item: SubjectItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={`rounded-xl p-3 flex items-center justify-between gap-2 border cursor-pointer select-none transition-all ${
        selected
          ? 'border-2 border-[#15803d] bg-white shadow-2xs'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold"
          style={{ backgroundColor: item.badgeBg, color: item.badgeFg }}
        >
          {item.badge}
        </span>
        <span className="truncate text-[13.5px] font-bold text-ink leading-tight">
          {item.name}
        </span>
      </div>
      {selected && (
        <span className="flex-shrink-0 text-[#15803d]">
          <Check size={16} strokeWidth={3} />
        </span>
      )}
    </div>
  );
}
