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

/**
 * Normalizes subject names for case-insensitive and abbreviation-tolerant matching
 */
export function normalizeSubjectName(name: string): string {
  const lower = name.toLowerCase().trim();
  if (lower === 'maths' || lower === 'math') return 'mathematics';
  if (lower === 'further maths') return 'further mathematics';
  if (lower === 'english') return 'english language';
  if (lower === 'agric' || lower === 'agric science') return 'agricultural science';
  if (lower === 'econs') return 'economics';
  if (lower === 'gov' || lower === 'govt') return 'government';
  if (lower === 'lit' || lower === 'literature') return 'literature in english';
  if (lower === 'geo') return 'geography';
  if (lower === 'crs' || lower === 'crk') return 'christian religious studies';
  if (lower === 'irs' || lower === 'irk') return 'islamic studies';
  if (lower === 'accounting' || lower === 'accounts') return 'financial accounting';
  return lower;
}

export function isSubjectSelected(
  subjectName: string,
  selectedSubjects?: string[] | null,
): boolean {
  if (!selectedSubjects || selectedSubjects.length === 0) return true;
  const targetNorm = normalizeSubjectName(subjectName);
  return selectedSubjects.some((s) => normalizeSubjectName(s) === targetNorm);
}

export function filterSubjectsByProfile<T extends { name: string }>(
  subjects: T[],
  profile?: StudentProfile | null,
): T[] {
  if (!profile || !profile.selectedSubjects || profile.selectedSubjects.length === 0) {
    return subjects;
  }
  const filtered = subjects.filter((s) => isSubjectSelected(s.name, profile.selectedSubjects));
  return filtered.length > 0 ? filtered : subjects;
}

export function filterTopicsByProfile<T extends { subject: string }>(
  topics: T[],
  profile?: StudentProfile | null,
): T[] {
  if (!profile || !profile.selectedSubjects || profile.selectedSubjects.length === 0) {
    return topics;
  }
  const filtered = topics.filter((t) => isSubjectSelected(t.subject, profile.selectedSubjects));
  return filtered;
}

export function addSubjectToProfile(subjectName: string): StudentProfile {
  let profile = getStudentProfile();
  if (!profile) {
    profile = {
      name: 'Student',
      class_level: 'SS3',
      targets: ['WAEC', 'School exams'],
      selectedSubjects: [...DEFAULT_SUBJECTS],
      completedOnboarding: true,
    };
  }
  const current = profile.selectedSubjects || [];
  if (!current.some((s) => normalizeSubjectName(s) === normalizeSubjectName(subjectName))) {
    profile.selectedSubjects = [...current, subjectName];
    saveStudentProfile(profile);
  }
  return profile;
}

export function removeSubjectFromProfile(subjectName: string): StudentProfile {
  let profile = getStudentProfile();
  if (!profile) {
    profile = {
      name: 'Student',
      class_level: 'SS3',
      targets: ['WAEC', 'School exams'],
      selectedSubjects: [...DEFAULT_SUBJECTS],
      completedOnboarding: true,
    };
  }
  const current = profile.selectedSubjects || [];
  const targetNorm = normalizeSubjectName(subjectName);
  profile.selectedSubjects = current.filter((s) => normalizeSubjectName(s) !== targetNorm);
  saveStudentProfile(profile);
  return profile;
}

export function toggleSubjectInProfile(subjectName: string): { profile: StudentProfile; added: boolean } {
  let profile = getStudentProfile();
  if (!profile) {
    profile = {
      name: 'Student',
      class_level: 'SS3',
      targets: ['WAEC', 'School exams'],
      selectedSubjects: [...DEFAULT_SUBJECTS],
      completedOnboarding: true,
    };
  }
  const current = profile.selectedSubjects || [];
  const targetNorm = normalizeSubjectName(subjectName);
  const exists = current.some((s) => normalizeSubjectName(s) === targetNorm);

  if (exists) {
    profile.selectedSubjects = current.filter((s) => normalizeSubjectName(s) !== targetNorm);
    saveStudentProfile(profile);
    return { profile, added: false };
  } else {
    profile.selectedSubjects = [...current, subjectName];
    saveStudentProfile(profile);
    return { profile, added: true };
  }
}

export function setProfileSubjects(subjects: string[]): StudentProfile {
  let profile = getStudentProfile();
  if (!profile) {
    profile = {
      name: 'Student',
      class_level: 'SS3',
      targets: ['WAEC', 'School exams'],
      selectedSubjects: [...subjects],
      completedOnboarding: true,
    };
  } else {
    profile.selectedSubjects = [...subjects];
  }
  saveStudentProfile(profile);
  return profile;
}
