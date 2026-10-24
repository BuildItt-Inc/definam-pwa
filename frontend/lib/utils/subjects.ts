import {
  Calculator,
  FlaskConical,
  FileText,
  Zap,
  TrendingUp,
  BookOpen,
  Leaf,
  Binary,
  Sprout,
  PenTool,
  Landmark,
  Utensils,
  ShoppingBag,
  Receipt,
  ShieldCheck,
  Cross,
  Moon,
  Globe,
  Laptop,
  Database,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SubjectCategory = 'core' | 'science' | 'arts' | 'commercial';

export interface CurriculumSubject {
  id: string;
  name: string;
  badge: string;
  category: SubjectCategory;
  categoryLabel: string;
  icon: LucideIcon;
  color: {
    bg: string;
    fg: string;
  };
}

export const ALL_CURRICULUM_SUBJECTS: CurriculumSubject[] = [
  // ── Core Subjects ───────────────────────────────────────────────
  {
    id: 'en',
    name: 'English Language',
    badge: 'En',
    category: 'core',
    categoryLabel: 'Core',
    icon: FileText,
    color: { bg: '#F5F3FF', fg: '#7C3AED' },
  },
  {
    id: 'ma',
    name: 'Mathematics',
    badge: 'Ma',
    category: 'core',
    categoryLabel: 'Core',
    icon: Calculator,
    color: { bg: '#EFF6FF', fg: '#2563EB' },
  },

  // ── Sciences ────────────────────────────────────────────────────
  {
    id: 'ph',
    name: 'Physics',
    badge: 'Ph',
    category: 'science',
    categoryLabel: 'Sciences',
    icon: Zap,
    color: { bg: '#FFF7ED', fg: '#EA580C' },
  },
  {
    id: 'ch',
    name: 'Chemistry',
    badge: 'Ch',
    category: 'science',
    categoryLabel: 'Sciences',
    icon: FlaskConical,
    color: { bg: '#ECFEFF', fg: '#0891B2' },
  },
  {
    id: 'bi',
    name: 'Biology',
    badge: 'Bi',
    category: 'science',
    categoryLabel: 'Sciences',
    icon: Leaf,
    color: { bg: '#ECFDF5', fg: '#16A34A' },
  },
  {
    id: 'fm',
    name: 'Further Mathematics',
    badge: 'Fm',
    category: 'science',
    categoryLabel: 'Sciences',
    icon: Binary,
    color: { bg: '#EEF2FF', fg: '#4F46E5' },
  },
  {
    id: 'ag',
    name: 'Agricultural Science',
    badge: 'Ag',
    category: 'science',
    categoryLabel: 'Sciences',
    icon: Sprout,
    color: { bg: '#F0FDF4', fg: '#15803D' },
  },
  {
    id: 'td',
    name: 'Technical Drawing',
    badge: 'Td',
    category: 'science',
    categoryLabel: 'Sciences',
    icon: PenTool,
    color: { bg: '#F8FAFC', fg: '#475569' },
  },

  // ── Arts & Humanities ───────────────────────────────────────────
  {
    id: 'li',
    name: 'Literature in English',
    badge: 'Li',
    category: 'arts',
    categoryLabel: 'Arts & Humanities',
    icon: BookOpen,
    color: { bg: '#FAF5FF', fg: '#9333EA' },
  },
  {
    id: 'ec',
    name: 'Economics',
    badge: 'Ec',
    category: 'arts',
    categoryLabel: 'Arts & Humanities',
    icon: TrendingUp,
    color: { bg: '#FDF2F8', fg: '#DB2777' },
  },
  {
    id: 'gv',
    name: 'Government',
    badge: 'Gv',
    category: 'arts',
    categoryLabel: 'Arts & Humanities',
    icon: Landmark,
    color: { bg: '#FFF1F2', fg: '#E11D48' },
  },
  {
    id: 'fn',
    name: 'Food and Nutrition',
    badge: 'Fn',
    category: 'arts',
    categoryLabel: 'Arts & Humanities',
    icon: Utensils,
    color: { bg: '#F0FDF4', fg: '#059669' },
  },

  // ── Commercial & Social Sciences ────────────────────────────────
  {
    id: 'cm',
    name: 'Commerce',
    badge: 'Cm',
    category: 'commercial',
    categoryLabel: 'Commercial & Vocational',
    icon: ShoppingBag,
    color: { bg: '#FEFCE8', fg: '#CA8A04' },
  },
  {
    id: 'ac',
    name: 'Financial Accounting',
    badge: 'Ac',
    category: 'commercial',
    categoryLabel: 'Commercial & Vocational',
    icon: Receipt,
    color: { bg: '#F0F9FF', fg: '#0284C7' },
  },
  {
    id: 'ce',
    name: 'Civic Education',
    badge: 'Ce',
    category: 'commercial',
    categoryLabel: 'Commercial & Vocational',
    icon: ShieldCheck,
    color: { bg: '#F5F3FF', fg: '#6D28D9' },
  },
  {
    id: 'cr',
    name: 'Christian Religious Studies',
    badge: 'Cr',
    category: 'commercial',
    categoryLabel: 'Commercial & Vocational',
    icon: Cross,
    color: { bg: '#EEF2FF', fg: '#4338CA' },
  },
  {
    id: 'ir',
    name: 'Islamic Studies',
    badge: 'Ir',
    category: 'commercial',
    categoryLabel: 'Commercial & Vocational',
    icon: Moon,
    color: { bg: '#ECFDF5', fg: '#047857' },
  },
  {
    id: 'gg',
    name: 'Geography',
    badge: 'Gg',
    category: 'commercial',
    categoryLabel: 'Commercial & Vocational',
    icon: Globe,
    color: { bg: '#FFF7ED', fg: '#C2410C' },
  },
  {
    id: 'cs',
    name: 'Computer Studies',
    badge: 'Cs',
    category: 'commercial',
    categoryLabel: 'Commercial & Vocational',
    icon: Laptop,
    color: { bg: '#F0FDFA', fg: '#0D9488' },
  },
  {
    id: 'dp',
    name: 'Data Processing',
    badge: 'Dp',
    category: 'commercial',
    categoryLabel: 'Commercial & Vocational',
    icon: Database,
    color: { bg: '#F1F5F9', fg: '#334155' },
  },
];

export const SUBJECT_ICONS: Record<string, LucideIcon> = Object.fromEntries(
  ALL_CURRICULUM_SUBJECTS.map((s) => [s.name, s.icon]),
);

export function subjectIcon(subject: string): LucideIcon {
  return SUBJECT_ICONS[subject] ?? BookOpen;
}

export interface SubjectColor {
  bg: string;
  fg: string;
}

export const SUBJECT_COLORS: Record<string, SubjectColor> = Object.fromEntries(
  ALL_CURRICULUM_SUBJECTS.map((s) => [s.name, s.color]),
);

const DEFAULT_COLOR: SubjectColor = { bg: '#F0FDF4', fg: '#16A34A' };

export function subjectColor(subject: string): SubjectColor {
  return SUBJECT_COLORS[subject] ?? DEFAULT_COLOR;
}
