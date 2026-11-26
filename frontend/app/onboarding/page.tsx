'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import {
  getStudentProfile,
  saveStudentProfile,
  type StudentProfile,
} from '@/lib/utils/studentProfile';
import { getMe } from '@/lib/api/auth';
import { ALL_CURRICULUM_SUBJECTS, type CurriculumSubject } from '@/lib/utils/subjects';
import { AnimatedRecallBird, type BirdMood } from '@/components/student/AnimatedRecallBird';

// ── Static curriculum option lists ────────────────────────────────────────────

type ClassOption = 'SS1' | 'SS2' | 'SS3' | 'Finished school';
const CLASS_OPTIONS: { value: ClassOption; hint: string }[] = [
  { value: 'SS1', hint: 'Senior Secondary 1' },
  { value: 'SS2', hint: 'Senior Secondary 2' },
  { value: 'SS3', hint: 'Final year prep' },
  { value: 'Finished school', hint: 'Post-secondary / JAMB' },
];

const EXAM_OPTIONS = ['WAEC', 'NECO', 'JAMB', 'School exams'];

const CORE_SUBJECTS = ALL_CURRICULUM_SUBJECTS.filter((s) => s.category === 'core');
const SCIENCE_SUBJECTS = ALL_CURRICULUM_SUBJECTS.filter((s) => s.category === 'science');
const ARTS_SUBJECTS = ALL_CURRICULUM_SUBJECTS.filter((s) => s.category === 'arts');
const COMMERCIAL_SUBJECTS = ALL_CURRICULUM_SUBJECTS.filter((s) => s.category === 'commercial');

// ── Motion helpers ────────────────────────────────────────────────────────────

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

const cardPullVariants: Variants = {
  initial: { opacity: 0, y: 56, scale: 0.985 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 24, mass: 0.9 },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.985,
    transition: { duration: 0.18, ease: EASE_OUT_EXPO },
  },
};

// ── Component ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  // step: 0=welcome, 1=name, 2=class, 3=exams, 4=subjects, 5=done
  const [step, setStep] = useState<number>(0);

  // form state
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassOption>('SS3');
  const [selectedTargets, setSelectedTargets] = useState<string[]>(['WAEC', 'School exams']);
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

  // Bird state: welcome | idle | nod | pulling | celebrate
  const [birdMood, setBirdMood] = useState<BirdMood>('welcome');
  const [birdNodKey, setBirdNodKey] = useState(0);
  const lastWordCountRef = useRef(0);
  const pullTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle word-count nod while typing name
  useEffect(() => {
    if (step === 1) {
      const wc = name.trim().split(/\s+/).filter(Boolean).length;
      if (wc > lastWordCountRef.current) {
        lastWordCountRef.current = wc;
        setBirdNodKey((k) => k + 1);
      } else if (wc < lastWordCountRef.current) {
        lastWordCountRef.current = wc;
      }
    }
  }, [name, step]);

  useEffect(() => {
    return () => {
      if (pullTimerRef.current) clearTimeout(pullTimerRef.current);
    };
  }, []);

  // Load existing profile / authenticated name without overriding with hardcoded placeholders
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const stepParam = urlParams.get('step');
      if (stepParam === '2') {
        setStep(4);
        setBirdMood('idle');
      }
    }

    const existing = getStudentProfile();
    if (existing) {
      if (existing.name) setName(existing.name);
      if (existing.class_level) setSelectedClass(existing.class_level);
      if (existing.targets && existing.targets.length > 0) setSelectedTargets(existing.targets);
      if (existing.selectedSubjects && existing.selectedSubjects.length > 0) {
        setSelectedSubjects(existing.selectedSubjects);
      }
    } else {
      getMe()
        .then((me) => {
          if (me?.name && me.name !== 'Student') {
            setName((prev) => prev || me.name || '');
          }
        })
        .catch(() => {});
    }
  }, []);

  const goToStep = (nextStep: number, withBirdPull = false) => {
    setStep(nextStep);
    if (pullTimerRef.current) clearTimeout(pullTimerRef.current);

    if (nextStep === 0) {
      setBirdMood('welcome');
      return;
    }
    if (nextStep === 5) {
      setBirdMood('celebrate');
      return;
    }
    if (withBirdPull) {
      setBirdMood('pulling');
      pullTimerRef.current = setTimeout(() => {
        setBirdMood('idle');
      }, 720);
    } else {
      setBirdMood('idle');
    }
  };

  const toggleTarget = (t: string) =>
    setSelectedTargets((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );

  const toggleSubject = (s: string) =>
    setSelectedSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const handleFinish = () => {
    const profile: StudentProfile = {
      name: name.trim(),
      class_level: selectedClass,
      targets: selectedTargets,
      selectedSubjects,
      completedOnboarding: true,
    };
    saveStudentProfile(profile);
    setTimeout(() => router.push('/student'), 1400);
  };

  useEffect(() => {
    if (step === 5) {
      handleFinish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const isWelcome = step === 0;
  const totalSteps = 5;
  const dotStep = Math.min(step, totalSteps);
  const isPulling = birdMood === 'pulling';

  return (
    <div className="min-h-screen bg-bg-0 flex flex-col items-center px-4 sm:px-6 pb-10 overflow-x-hidden">
      {/* ── Project bird mascot + step progress ──────────────────────── */}
      <div className="flex flex-col items-center pt-9 sm:pt-12 mb-4 relative">
        <AnimatedRecallBird
          size={isWelcome ? 76 : step === 5 ? 64 : 50}
          mood={birdMood}
          nodKey={birdNodKey}
        />

        {/* Subtle pull-line connecting beak to the rising options card during transitions */}
        <AnimatePresence>
          {isPulling && (
            <motion.div
              aria-hidden
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              transition={{ duration: 0.25 }}
              style={{ transformOrigin: 'top center' }}
              className="w-[2px] h-5 bg-gradient-to-b from-brand to-brand/20 rounded-full -mt-1"
            />
          )}
        </AnimatePresence>

        {/* Step dots */}
        {!isWelcome && step < 5 && (
          <div className="flex items-center gap-1.5 mt-3.5" aria-label={`Step ${dotStep} of 4`}>
            {Array.from({ length: 4 }).map((_, i) => {
              const active = dotStep === i + 1;
              const completed = i + 1 < dotStep;
              return (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    active
                      ? 'w-6 bg-brand'
                      : completed
                      ? 'w-2 bg-brand/50'
                      : 'w-2 bg-border-2'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Animated step card ────────────────────────────────────────── */}
      <div className={`w-full flex-1 flex flex-col ${step === 4 ? 'max-w-[540px]' : 'max-w-[430px]'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={cardPullVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 flex flex-col"
          >
            {step === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center pb-12">
                <span className="inline-flex items-center rounded-full bg-brand-tint px-3 py-1 text-[11.5px] font-bold text-brand tracking-wide mb-4">
                  Welcome to Recall
                </span>
                <h1 className="text-[32px] sm:text-[36px] font-extrabold text-ink tracking-tight leading-[1.15] mb-3">
                  Let&apos;s set up your study plan
                </h1>
                <p className="text-[15px] text-muted max-w-[300px] leading-relaxed mb-10">
                  Tell us a little about what you&apos;re preparing for. Takes under 30 seconds.
                </p>
                <button
                  type="button"
                  onClick={() => goToStep(1, true)}
                  className="btn-primary px-8 min-h-[50px] text-[15.5px]"
                >
                  <span>Get started</span>
                  <ArrowRight size={17} strokeWidth={2.2} />
                </button>
              </div>
            )}

            {step === 1 && (
              <NameStep
                name={name}
                setName={setName}
                onContinue={() => goToStep(2, true)}
              />
            )}

            {step === 2 && (
              <ClassStep
                studentName={name.trim()}
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                onContinue={() => goToStep(3, true)}
                onBack={() => goToStep(1)}
              />
            )}

            {step === 3 && (
              <ExamStep
                selectedTargets={selectedTargets}
                toggleTarget={toggleTarget}
                onContinue={() => goToStep(4, true)}
                onBack={() => goToStep(2)}
              />
            )}

            {step === 4 && (
              <SubjectsStep
                selectedSubjects={selectedSubjects}
                toggleSubject={toggleSubject}
                showMoreSubjects={showMoreSubjects}
                setShowMoreSubjects={setShowMoreSubjects}
                onContinue={() => goToStep(5)}
                onBack={() => goToStep(3)}
              />
            )}

            {step === 5 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center pb-12">
                <h1 className="text-[30px] sm:text-[34px] font-extrabold text-ink tracking-tight leading-tight mb-2.5">
                  You&apos;re all set{name.trim() ? `, ${name.trim()}` : ''}!
                </h1>
                <p className="text-[14.5px] text-muted">
                  Opening your personalised Recall workspace…
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Sub-steps ────────────────────────────────────────────────────────────────

function NameStep({
  name,
  setName,
  onContinue,
}: {
  name: string;
  setName: (v: string) => void;
  onContinue: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 140);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex-1 flex flex-col rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-2xs">
      <h1 className="text-[26px] font-extrabold text-ink tracking-tight leading-tight mb-1.5">
        What&apos;s your name?
      </h1>
      <p className="text-[14px] text-muted mb-7">
        Recall and Zikora will greet you by name.
      </p>
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && name.trim() && onContinue()}
        placeholder="e.g. Chisom or Amina"
        className="w-full rounded-xl border border-border-2 bg-bg-0 px-4 py-3.5 text-[17px] font-semibold text-ink placeholder:text-faint focus:border-ink focus:ring-2 focus:ring-ink/5 focus:outline-none transition-all"
        autoComplete="given-name"
      />
      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={onContinue}
          disabled={!name.trim()}
          className="btn-primary w-full min-h-[48px] text-[15.5px] disabled:opacity-35 disabled:cursor-not-allowed"
        >
          <span>Continue</span>
          <ArrowRight size={17} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

function ClassStep({
  studentName,
  selectedClass,
  setSelectedClass,
  onContinue,
  onBack,
}: {
  studentName: string;
  selectedClass: ClassOption;
  setSelectedClass: (c: ClassOption) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-2xs">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-muted text-[13px] font-semibold mb-5 self-start hover:text-ink transition-colors"
      >
        <ArrowLeft size={14} strokeWidth={2.2} />
        Back
      </button>
      <h1 className="text-[26px] font-extrabold text-ink tracking-tight leading-tight mb-1.5">
        {studentName ? `Nice to meet you, ${studentName}.` : 'What class are you in?'}
      </h1>
      <p className="text-[14px] text-muted mb-6">
        Select your current class level.
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {CLASS_OPTIONS.map((c, i) => {
          const selected = selectedClass === c.value;
          return (
            <motion.button
              key={c.value}
              type="button"
              onClick={() => setSelectedClass(c.value)}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: i * 0.055, type: 'spring' as const, stiffness: 300, damping: 24 },
              }}
              whileTap={{ scale: 0.97 }}
              className={`rounded-xl p-4 text-left border transition-all ${
                selected
                  ? 'border-brand border-2 bg-brand-tint/60'
                  : 'border-border-2 bg-bg-0/60 hover:border-ink/25 hover:bg-card'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[15.5px] font-bold text-ink">{c.value}</span>
                {selected && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11.5px] text-muted">{c.hint}</p>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={onContinue}
          className="btn-primary w-full min-h-[48px] text-[15.5px]"
        >
          <span>Continue</span>
          <ArrowRight size={17} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

function ExamStep({
  selectedTargets,
  toggleTarget,
  onContinue,
  onBack,
}: {
  selectedTargets: string[];
  toggleTarget: (t: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-2xs">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-muted text-[13px] font-semibold mb-5 self-start hover:text-ink transition-colors"
      >
        <ArrowLeft size={14} strokeWidth={2.2} />
        Back
      </button>
      <h1 className="text-[26px] font-extrabold text-ink tracking-tight leading-tight mb-1.5">
        What are you preparing for?
      </h1>
      <p className="text-[14px] text-muted mb-7">Pick all that apply.</p>

      <div className="flex flex-wrap gap-2.5">
        {EXAM_OPTIONS.map((t, i) => {
          const selected = selectedTargets.includes(t);
          return (
            <motion.button
              key={t}
              type="button"
              onClick={() => toggleTarget(t)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, transition: { delay: i * 0.055, duration: 0.28 } }}
              whileTap={{ scale: 0.96 }}
              className={`rounded-full px-4 py-2.5 text-[13.5px] font-bold border transition-all flex items-center gap-2 ${
                selected
                  ? 'border-brand border-2 bg-brand-tint text-brand'
                  : 'border-border-2 bg-bg-0/60 text-ink hover:border-ink/25'
              }`}
            >
              {selected && <Check size={14} strokeWidth={3} />}
              {t}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={onContinue}
          className="btn-primary w-full min-h-[48px] text-[15.5px]"
        >
          <span>Continue</span>
          <ArrowRight size={17} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

const SUBJECT_GROUPS: { label: string; items: CurriculumSubject[] }[] = [
  { label: 'Core', items: CORE_SUBJECTS },
  { label: 'Sciences', items: SCIENCE_SUBJECTS },
  { label: 'Arts & Humanities', items: ARTS_SUBJECTS },
];

function SubjectsStep({
  selectedSubjects,
  toggleSubject,
  showMoreSubjects,
  setShowMoreSubjects,
  onContinue,
  onBack,
}: {
  selectedSubjects: string[];
  toggleSubject: (s: string) => void;
  showMoreSubjects: boolean;
  setShowMoreSubjects: (v: boolean) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col pb-24">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xs">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-muted text-[13px] font-semibold mb-4 self-start hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={2.2} />
          Back
        </button>
        <h1 className="text-[25px] font-extrabold text-ink tracking-tight leading-tight mb-1.5">
          Pick your subjects
        </h1>
        <p className="text-[13.5px] text-muted mb-6">
          Choose the ones you study. You can update these anytime in Subjects.
        </p>

        <div className="space-y-5">
          {SUBJECT_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2.5">
                {group.label}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {group.items.map((subj, i) => (
                  <motion.div
                    key={subj.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.22 } }}
                  >
                    <SubjectChip
                      item={subj}
                      selected={selectedSubjects.includes(subj.name)}
                      onToggle={() => toggleSubject(subj.name)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          ))}

          {/* More subjects */}
          {showMoreSubjects ? (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2.5">
                Commercial &amp; Social Sciences
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {COMMERCIAL_SUBJECTS.map((subj, i) => (
                  <motion.div
                    key={subj.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.22 } }}
                  >
                    <SubjectChip
                      item={subj}
                      selected={selectedSubjects.includes(subj.name)}
                      onToggle={() => toggleSubject(subj.name)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setShowMoreSubjects(true)}
                className="text-[13.5px] font-bold text-brand underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                Show {COMMERCIAL_SUBJECTS.length} more subjects
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom confirmation bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border px-4 py-3">
        <div className="max-w-[540px] mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-[17px] font-extrabold text-ink">{selectedSubjects.length}</span>{' '}
            <span className="text-[13px] text-muted">selected</span>
          </div>
          <button
            type="button"
            onClick={onContinue}
            disabled={selectedSubjects.length === 0}
            className="btn-primary px-6 py-2.5 min-h-[44px] text-[14.5px] disabled:opacity-35 disabled:cursor-not-allowed"
          >
            <span>Finish setup</span>
            <ArrowRight size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}

function SubjectChip({
  item,
  selected,
  onToggle,
}: {
  item: CurriculumSubject;
  selected: boolean;
  onToggle: () => void;
}) {
  const Icon = item.icon;
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      whileTap={{ scale: 0.97 }}
      className={`w-full rounded-xl px-3 py-3 flex items-center justify-between gap-2 border text-left cursor-pointer select-none transition-all ${
        selected
          ? 'border-brand border-2 bg-brand-tint/60'
          : 'border-border-2 bg-bg-0/50 hover:border-ink/25 hover:bg-card'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="flex flex-shrink-0 items-center justify-center"
          style={{ color: item.color.fg }}
        >
          <Icon size={22} strokeWidth={1.8} />
        </span>
        <span className="truncate text-[13px] font-bold text-ink leading-tight">{item.name}</span>
      </div>
      {selected && (
        <span className="flex-shrink-0 text-brand">
          <Check size={15} strokeWidth={3} />
        </span>
      )}
    </motion.button>
  );
}
