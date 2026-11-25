'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LogOut,
  Pencil,
  Check,
  X,
  Bell,
  Download,
  Lock,
  MessageSquarePlus,
  HelpCircle,
  Bug,
  ChevronRight,
} from 'lucide-react';
import {
  changePassword,
  getMe,
  getCachedMe,
  updateCachedMe,
  logout,
  ApiError,
  getAuthHeaders,
  handleAuthError,
} from '@/lib/api/auth';
import {
  getHomeData,
  getCachedHomeData,
  getSubjects,
  getCachedSubjects,
} from '@/lib/api/topics';
import {
  getStudentProfile,
  saveStudentProfile,
  filterSubjectsByProfile,
  DEFAULT_SUBJECTS,
  type StudentProfile,
} from '@/lib/utils/studentProfile';
import {
  requestNotificationPermissionAndGetToken,
  getStoredFcmToken,
  clearStoredFcmToken,
  showLocalNotification,
} from '@/lib/firebase';
import {
  registerNotificationToken,
  unregisterNotificationToken,
  sendTestNotification,
} from '@/lib/api/notifications';
import { toast } from '@/lib/toast';
import type { UserMe } from '@/types/auth';
import type { HomeData, Subject } from '@/types/topics';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { AppInstallModal } from '@/components/ui/AppInstallModal';

const APP_VERSION = '0.1.0';
const CLASS_LEVELS: StudentProfile['class_level'][] = ['SS1', 'SS2', 'SS3', 'Finished school'];
const TARGET_OPTIONS = ['WAEC', 'NECO', 'JAMB', 'School exams'];

function SettingsSkeleton() {
  return (
    <div className="page-with-nav bg-bg-0">
      <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-[calc(env(safe-area-inset-top)+16px)]">
        <div className="mb-4 h-7 w-24 animate-pulse rounded bg-bg-3" />
        <div className="mb-5 h-36 animate-pulse rounded-2xl bg-bg-2" />
        <div className="mb-5 h-16 animate-pulse rounded-2xl bg-bg-2" />
        <div className="mb-5 h-32 animate-pulse rounded-2xl bg-bg-2" />
        <div className="h-36 animate-pulse rounded-2xl bg-bg-2" />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { isIOS, isInstalled, canInstall, promptInstall, showInstallModal, setShowInstallModal } =
    usePWAInstall();

  const [me, setMe] = useState<UserMe | null>(() => getCachedMe());
  const [profile, setProfile] = useState<StudentProfile | null>(() => getStudentProfile());
  const [homeData, setHomeData] = useState<HomeData | null>(() => getCachedHomeData());
  const [subjects, setSubjects] = useState<Subject[] | null>(() => getCachedSubjects());
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  // Inline display-name edit state inside dark hero card
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(() => {
    const p = getStudentProfile();
    const cached = getCachedMe();
    const cachedHome = getCachedHomeData();
    const validProfileName = p?.name && p.name.trim() && p.name.trim() !== 'Student' ? p.name.trim() : '';
    return cached?.name || cachedHome?.student_name || validProfileName || cached?.username || '';
  });
  const [nameError, setNameError] = useState(false);
  const [savingName, setSavingName] = useState(false);

  // Class & targets modal
  const [showStudyPlanModal, setShowStudyPlanModal] = useState(false);
  const [draftClass, setDraftClass] = useState<StudentProfile['class_level']>(
    () => getStudentProfile()?.class_level ?? 'SS3',
  );
  const [draftTargets, setDraftTargets] = useState<string[]>(
    () => getStudentProfile()?.targets ?? ['WAEC', 'School exams'],
  );

  // Change password modal (opens cleanly from Account -> Change password row)
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwForm, setPwForm] = useState({ new_password: '', confirm_password: '' });
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // Logout & notifications
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [testNotifLoading, setTestNotifLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifEnabled(Notification.permission === 'granted' && !!getStoredFcmToken());
    }
  }, []);

  useEffect(() => {
    const handleProfileUpdate = () => {
      setProfile(getStudentProfile());
    };
    window.addEventListener('studentProfileUpdated', handleProfileUpdate as EventListener);
    window.addEventListener('focus', handleProfileUpdate);
    return () => {
      window.removeEventListener('studentProfileUpdated', handleProfileUpdate as EventListener);
      window.removeEventListener('focus', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    async function load() {
      setFetchError(null);
      try {
        const [meData, home, subjectsData] = await Promise.all([
          getMe(),
          getHomeData(),
          getSubjects().catch(() => [] as Subject[]),
        ]);
        setMe(meData);
        setHomeData(home);
        if (subjectsData.length > 0) setSubjects(subjectsData);
        const resolvedName = meData.name || home.student_name || meData.username || '';
        setNameInput((prev) => (!prev || prev === 'Student' ? resolvedName : prev));
      } catch (err: unknown) {
        if (!handleAuthError(err, router)) {
          setFetchError(err instanceof Error ? err.message : 'Failed to load');
        }
      }
    }
    void load();
  }, [router, retryTick]);

  async function handleToggleNotifications() {
    setNotifLoading(true);
    try {
      if (notifEnabled) {
        const token = getStoredFcmToken();
        if (token) {
          await unregisterNotificationToken(token).catch(() => {});
          clearStoredFcmToken();
        }
        setNotifEnabled(false);
        toast.info('Daily reminders disabled');
      } else {
        if (isIOS && !isInstalled) {
          setShowInstallModal(true);
          toast.info('On iPhone, add Recall to your Home Screen first to enable notifications.');
          setNotifLoading(false);
          return;
        }

        const token = await requestNotificationPermissionAndGetToken();
        if (token) {
          await registerNotificationToken(token, isIOS ? 'ios_web' : 'web');
          setNotifEnabled(true);
          toast.success('Daily reminders enabled');
        } else {
          toast.info('Notification permission was dismissed.');
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update notifications');
    } finally {
      setNotifLoading(false);
    }
  }

  async function handleSendTestNotification() {
    setTestNotifLoading(true);
    try {
      const token = getStoredFcmToken();
      let sentViaCloud = false;

      if (token) {
        try {
          await sendTestNotification();
          sentViaCloud = true;
          toast.success('Test notification sent to your device!');
        } catch {
          sentViaCloud = false;
        }
      }

      if (!sentViaCloud) {
        await showLocalNotification('Recall Test Notification', {
          body: 'Push notifications are working on this device.',
          tag: 'recall-test-alert',
        });
        toast.success('Test notification delivered locally!');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send test notification');
    } finally {
      setTestNotifLoading(false);
    }
  }

  async function handleLogout() {
    setLogoutLoading(true);
    try {
      await logout();
    } catch {
      /* best-effort */
    }
    router.replace('/login');
  }

  function handleCancelEdit() {
    setNameInput(profile?.name || me?.name || me?.username || '');
    setIsEditingName(false);
    setNameError(false);
  }

  async function handleSaveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setSavingName(true);
    setNameError(false);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error('Failed to update name');
      updateCachedMe({ name: trimmed });
      setMe((prev) => (prev ? { ...prev, name: trimmed } : prev));
      const existing = getStudentProfile();
      saveStudentProfile({
        name: trimmed,
        class_level: existing?.class_level ?? 'SS3',
        targets: existing?.targets ?? ['WAEC', 'School exams'],
        selectedSubjects: existing?.selectedSubjects ?? DEFAULT_SUBJECTS,
        completedOnboarding: existing?.completedOnboarding ?? true,
      });
      setIsEditingName(false);
      toast.success('Name updated');
    } catch {
      setNameError(true);
    } finally {
      setSavingName(false);
    }
  }

  function openStudyPlanModal() {
    setDraftClass(profile?.class_level ?? 'SS3');
    setDraftTargets(profile?.targets && profile.targets.length > 0 ? profile.targets : ['WAEC', 'School exams']);
    setShowStudyPlanModal(true);
  }

  function toggleDraftTarget(target: string) {
    setDraftTargets((prev) => {
      if (prev.includes(target)) {
        return prev.length > 1 ? prev.filter((t) => t !== target) : prev;
      }
      return [...prev, target];
    });
  }

  function handleSaveStudyPlan() {
    const existing = getStudentProfile();
    saveStudentProfile({
      name: existing?.name || displayName,
      class_level: draftClass,
      targets: draftTargets,
      selectedSubjects: existing?.selectedSubjects ?? DEFAULT_SUBJECTS,
      completedOnboarding: existing?.completedOnboarding ?? true,
    });
    setShowStudyPlanModal(false);
    toast.success('Study plan updated');
  }

  async function handleChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('Passwords do not match');
      return;
    }
    setPwLoading(true);
    try {
      await changePassword({
        new_password: pwForm.new_password,
        confirm_password: pwForm.confirm_password,
      });
      setPwSuccess(true);
      setPwForm({ new_password: '', confirm_password: '' });
      toast.success('Password updated');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPwSuccess(false);
      }, 900);
    } catch (err) {
      setPwError(err instanceof ApiError && err.message ? err.message : 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  }

  function handleInstallClick() {
    if (canInstall) {
      void promptInstall();
    } else {
      setShowInstallModal(true);
    }
  }

  if (fetchError && !me && !profile && !nameInput) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg-0 px-6 text-center">
        <p className="text-sm text-muted">{fetchError}</p>
        <button
          type="button"
          onClick={() => setRetryTick((n) => n + 1)}
          className="btn-primary px-5 text-xs"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!me && !profile && !nameInput) return <SettingsSkeleton />;

  const schoolName = homeData?.school_name ?? '';
  const isIndividual = me ? me.role === 'student_individual' : !schoolName;
  const validProfileName =
    profile?.name && profile.name.trim() && profile.name.trim() !== 'Student'
      ? profile.name.trim()
      : '';
  const displayName = (
    (nameInput && nameInput !== 'Student' ? nameInput : '') ||
    me?.name ||
    homeData?.student_name ||
    validProfileName ||
    me?.username ||
    'Account'
  ).trim();
  const avatarLetter = displayName.charAt(0).toUpperCase() || 'A';

  const streakDays = homeData?.streak_days ?? 0;
  const completionPercent = homeData?.completion_percent ?? 0;
  const activeSubjectsCount = subjects
    ? filterSubjectsByProfile(subjects, profile).length
    : (profile?.selectedSubjects?.length ?? 0);

  const studyPlanSummary = profile?.class_level
    ? `${profile.class_level}${profile.targets?.length ? ` · ${profile.targets.join(', ')}` : ''}`
    : 'Set your class and exam targets';

  return (
    <>
    <div className="page-with-nav bg-bg-0 page-enter">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-nav">
        <h1 className="mb-4 text-[24px] font-bold tracking-tight text-ink">Settings</h1>

        {/* ── Hero Profile Card ── */}
        <section className="mb-5 rounded-2xl bg-ink p-4 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand text-[18px] font-bold text-white">
              {avatarLetter}
            </div>

            <div className="min-w-0 flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full min-w-0 rounded-lg border border-white/25 bg-white/10 px-2.5 py-1 text-[15px] font-semibold text-white placeholder:text-white/50 focus:border-brand-light focus:outline-none"
                    autoFocus
                    maxLength={40}
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={savingName}
                    aria-label="Save name"
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand text-white disabled:opacity-50 active:scale-95"
                  >
                    <Check size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    aria-label="Cancel"
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-white active:scale-95"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <>
                  <p className="truncate text-[16px] font-bold leading-tight text-white">
                    {displayName}
                  </p>
                  <p className="mt-0.5 truncate text-[12.5px] text-white/65">
                    {isIndividual ? 'Independent Learner' : schoolName}
                    {profile?.class_level ? ` · ${profile.class_level}` : ''}
                  </p>
                </>
              )}
              {nameError && (
                <p className="mt-1 text-[12px] text-red-300">
                  Could not save. Check your connection.
                </p>
              )}
            </div>

            {!isEditingName && (
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                aria-label="Edit name"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white/85 transition-colors hover:bg-white/20 active:scale-95"
              >
                <Pencil size={15} strokeWidth={2} />
              </button>
            )}
          </div>

          <div className="my-3.5 border-t border-white/10" />

          <div className="grid grid-cols-3 text-center">
            <div>
              <p className="text-[18px] font-bold leading-none text-white tabular-nums">
                {streakDays}
              </p>
              <p className="mt-1 text-[11.5px] text-white/60">Day streak</p>
            </div>
            <div>
              <p className="text-[18px] font-bold leading-none text-white tabular-nums">
                {activeSubjectsCount}
              </p>
              <p className="mt-1 text-[11.5px] text-white/60">Subjects</p>
            </div>
            <div>
              <p className="text-[18px] font-bold leading-none text-white tabular-nums">
                {completionPercent}%
              </p>
              <p className="mt-1 text-[11.5px] text-white/60">Overall done</p>
            </div>
          </div>
        </section>

        {/* ── STUDY PLAN (Class & targets only — no duplicate subjects card) ── */}
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Study plan
        </p>
        <div className="mb-5 overflow-hidden rounded-2xl border border-border bg-card">
          <button
            type="button"
            onClick={openStudyPlanModal}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-bg-0 active:bg-bg-2"
          >
            <div className="min-w-0">
              <p className="text-[12px] text-muted leading-tight">Class &amp; targets</p>
              <p className="mt-0.5 truncate text-[14px] font-semibold text-ink">
                {studyPlanSummary}
              </p>
            </div>
            <ChevronRight size={16} className="flex-shrink-0 text-faint" />
          </button>
        </div>

        {/* ── PREFERENCES ── */}
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Preferences
        </p>
        <div className="mb-5 overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
          <div className="px-4 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="flex w-7 flex-shrink-0 items-center justify-center text-ink-2">
                  <Bell size={22} strokeWidth={1.65} />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-ink leading-tight">Daily reminders</p>
                  <p className="mt-0.5 text-[12px] text-muted leading-snug">
                    Review alerts and streak nudges
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleNotifications}
                disabled={notifLoading}
                className={`shrink-0 rounded-full px-4 py-1.5 text-[12.5px] font-bold transition-all active:scale-95 disabled:opacity-60 ${
                  notifEnabled
                    ? 'bg-brand-tint text-brand'
                    : 'bg-brand text-white hover:bg-brand-dark'
                }`}
              >
                {notifLoading ? 'Updating...' : notifEnabled ? 'Enabled' : 'Enable'}
              </button>
            </div>

            {isIOS && !isInstalled && (
              <div className="mt-3 rounded-xl bg-warn-bg px-3 py-2.5">
                <p className="text-[12px] font-medium text-warn leading-snug">
                  On iPhone, add Recall to your Home Screen first before notifications can arrive.
                </p>
                <button
                  type="button"
                  onClick={() => setShowInstallModal(true)}
                  className="mt-1 text-[12px] font-semibold text-ink underline"
                >
                  View iPhone guide →
                </button>
              </div>
            )}

            {notifEnabled && (
              <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-bg-0 px-3 py-2 border border-border">
                <span className="text-[12px] text-muted truncate">
                  Verify alerts on this device
                </span>
                <button
                  type="button"
                  onClick={() => handleSendTestNotification()}
                  disabled={testNotifLoading}
                  className="shrink-0 rounded-lg border border-border-2 bg-card px-2.5 py-1 text-[11.5px] font-semibold text-ink hover:bg-bg-2 active:scale-95 disabled:opacity-50"
                >
                  {testNotifLoading ? 'Testing…' : 'Send test'}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleInstallClick}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-bg-0 active:bg-bg-2"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="flex w-7 flex-shrink-0 items-center justify-center text-ink-2">
                <Download size={22} strokeWidth={1.65} />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-ink leading-tight">Install Recall</p>
                <p className="mt-0.5 text-[12px] text-muted leading-snug">
                  {isInstalled
                    ? 'Installed on this device'
                    : 'One-tap access from your home screen'}
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="flex-shrink-0 text-faint" />
          </button>
        </div>

        {/* ── ACCOUNT ── */}
        {isIndividual && (
          <>
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
              Account
            </p>
            <div className="mb-5 overflow-hidden rounded-2xl border border-border bg-card">
              <button
                type="button"
                onClick={() => {
                  setPwError(null);
                  setPwSuccess(false);
                  setShowPasswordModal(true);
                }}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-bg-0 active:bg-bg-2"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="flex w-7 flex-shrink-0 items-center justify-center text-ink-2">
                    <Lock size={22} strokeWidth={1.65} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-ink leading-tight">Change password</p>
                    <p className="mt-0.5 text-[12px] text-muted">Opens a secure form</p>
                  </div>
                </div>
                <ChevronRight size={16} className="flex-shrink-0 text-faint" />
              </button>
            </div>
          </>
        )}

        {/* ── HELP ── */}
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Help
        </p>
        <div className="mb-4 overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
          <a
            href="mailto:support@definam.ng?subject=Recall%20App%20Feedback"
            className="flex items-center justify-between gap-3 px-4 py-3.5 text-ink transition-colors hover:bg-bg-0 active:bg-bg-2"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="flex w-7 flex-shrink-0 items-center justify-center text-ink-2">
                <MessageSquarePlus size={22} strokeWidth={1.65} />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-ink leading-tight">Send feedback</p>
                <p className="mt-0.5 text-[12px] text-muted">Suggest an improvement</p>
              </div>
            </div>
            <ChevronRight size={16} className="flex-shrink-0 text-faint" />
          </a>

          <button
            type="button"
            onClick={() => setShowInstallModal(true)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-ink transition-colors hover:bg-bg-0 active:bg-bg-2"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="flex w-7 flex-shrink-0 items-center justify-center text-ink-2">
                <HelpCircle size={22} strokeWidth={1.65} />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-ink leading-tight">Install guide</p>
                <p className="mt-0.5 text-[12px] text-muted">iPhone and Android steps</p>
              </div>
            </div>
            <ChevronRight size={16} className="flex-shrink-0 text-faint" />
          </button>

          <a
            href="https://forms.gle/G93Xc3xbM12p1M327"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 px-4 py-3.5 text-ink transition-colors hover:bg-bg-0 active:bg-bg-2"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="flex w-7 flex-shrink-0 items-center justify-center text-warn">
                <Bug size={22} strokeWidth={1.65} />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-ink leading-tight">Report a bug</p>
                <p className="mt-0.5 text-[12px] text-muted">Something not working? Tell us</p>
              </div>
            </div>
            <ChevronRight size={16} className="flex-shrink-0 text-faint" />
          </a>
        </div>

        {/* Legal links */}
        <div className="mb-4 flex items-center justify-center gap-4 text-[12.5px] text-muted">
          <Link href="/terms" className="underline underline-offset-2 hover:text-ink">
            Terms of Service
          </Link>
          <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
            Privacy Policy
          </Link>
        </div>

        {/* Log out */}
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-[15px] font-semibold text-danger transition-colors hover:bg-danger-bg/40 active:scale-[0.99]"
        >
          <LogOut size={16} strokeWidth={2} />
          <span>Log out</span>
        </button>

        <p className="mt-6 text-center text-[12px] text-faint">v{APP_VERSION}</p>
      </main>
    </div>

      {/* ── Study Plan Modal (outside page-enter stacking context) ── */}
      {showStudyPlanModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/50 px-4"
          onClick={() => setShowStudyPlanModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[17px] font-bold text-ink">Class &amp; targets</h2>
              <button
                type="button"
                onClick={() => setShowStudyPlanModal(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-bg-2"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-[12.5px] font-semibold text-muted">Class level</p>
              <div className="grid grid-cols-2 gap-2">
                {CLASS_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDraftClass(lvl)}
                    className={`rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-all ${
                      draftClass === lvl
                        ? 'border-ink bg-ink text-white'
                        : 'border-border bg-bg-0 text-ink hover:bg-bg-2'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <p className="mb-2 text-[12.5px] font-semibold text-muted">Exam targets</p>
              <div className="flex flex-wrap gap-2">
                {TARGET_OPTIONS.map((t) => {
                  const selected = draftTargets.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleDraftTarget(t)}
                      className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-all ${
                        selected
                          ? 'border-brand bg-brand-tint text-brand'
                          : 'border-border bg-bg-0 text-muted hover:text-ink'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowStudyPlanModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStudyPlan}
                className="btn-primary flex-1"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/50 px-4"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[17px] font-bold text-ink">Change password</h2>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-bg-2"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="mb-3">
                <label className="mb-1 block text-[13px] font-semibold text-muted">
                  New password
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={pwForm.new_password}
                  onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-[13px] font-semibold text-muted">
                  Confirm password
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={pwForm.confirm_password}
                  onChange={(e) => setPwForm((f) => ({ ...f, confirm_password: e.target.value }))}
                  autoComplete="new-password"
                  required
                />
              </div>
              {pwError && <p className="mb-3 text-[13.5px] text-danger">{pwError}</p>}
              {pwSuccess && (
                <p className="mb-3 text-[13.5px] text-success">Password updated successfully.</p>
              )}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="btn-primary flex-1 disabled:opacity-60"
                >
                  {pwLoading ? 'Saving...' : 'Save password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Log Out Confirm Modal ── */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/60"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="mx-4 w-full max-w-md animate-slide-up rounded-3xl bg-bg-0 px-6 pb-6 pt-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-2 text-lg font-bold text-ink">Log out?</p>
            {!isIndividual && (
              <p className="mb-5 text-sm text-muted leading-snug">
                You will need your school access code to log back in.
              </p>
            )}
            <div className={`flex gap-3 ${isIndividual ? 'mt-5' : ''}`}>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutLoading}
                className="flex-1 rounded-xl bg-danger py-3.5 text-base font-bold text-white disabled:opacity-60 active:opacity-90 transition-opacity"
              >
                {logoutLoading ? 'Signing out...' : 'Log out'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AppInstallModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
    </>
  );
}
