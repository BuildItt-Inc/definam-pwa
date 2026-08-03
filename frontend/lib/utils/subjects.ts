import { Calculator, FlaskConical, FileText, Zap, TrendingUp, BookOpen } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Single shared source for subject -> icon/color, used by SubjectCard (Browse
// list) and the dashboard (subject strip, topic row icon backgrounds) so the
// two surfaces can't silently drift apart. Extend this when a new subject is
// seeded.

export const SUBJECT_ICONS: Record<string, LucideIcon> = {
  Mathematics: Calculator,
  Chemistry: FlaskConical,
  'English Language': FileText,
  Physics: Zap,
  Economics: TrendingUp,
};

export function subjectIcon(subject: string): LucideIcon {
  return SUBJECT_ICONS[subject] ?? BookOpen;
}

export interface SubjectColor {
  bg: string;
  fg: string;
}

export const SUBJECT_COLORS: Record<string, SubjectColor> = {
  Mathematics: { bg: '#EFF6FF', fg: '#2563EB' },
  Chemistry: { bg: '#ECFDF5', fg: '#16A34A' },
  'English Language': { bg: '#F5F3FF', fg: '#7C3AED' },
  Physics: { bg: '#FFF7ED', fg: '#D97706' },
  Economics: { bg: '#F0FDFA', fg: '#0D9488' },
};

const DEFAULT_COLOR: SubjectColor = { bg: '#F0FDF4', fg: '#16A34A' };

export function subjectColor(subject: string): SubjectColor {
  return SUBJECT_COLORS[subject] ?? DEFAULT_COLOR;
}
