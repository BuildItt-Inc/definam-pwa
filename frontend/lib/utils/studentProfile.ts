export interface StudentProfile {
  name: string;
  class_level: 'SS1' | 'SS2' | 'SS3' | 'Finished school';
  targets: string[]; // e.g. ['WAEC', 'School exams']
  selectedSubjects: string[]; // e.g. ['English Language', 'Mathematics', 'Physics', 'Chemistry']
  completedOnboarding: boolean;
  updatedAt?: string;
}

const STORAGE_KEY = 'recall_student_profile';

export const DEFAULT_SUBJECTS = [
  'English Language',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
];

export function getStudentProfile(): StudentProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StudentProfile;
  } catch {
    return null;
  }
}

export function saveStudentProfile(profile: StudentProfile): void {
  if (typeof window === 'undefined') return;
  try {
    const enriched = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enriched));
    window.dispatchEvent(new CustomEvent('studentProfileUpdated', { detail: enriched }));
  } catch {
    // ignore quota errors
  }
}

export function getSelectedSubjectNames(): string[] | null {
  const profile = getStudentProfile();
  if (profile && profile.selectedSubjects && profile.selectedSubjects.length > 0) {
    return profile.selectedSubjects;
  }
  return null;
}
