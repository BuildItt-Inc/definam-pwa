'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Pencil, Check, X, Bell, MessageSquarePlus, HelpCircle, Bug, ChevronRight } from 'lucide-react';
import { changePassword, getMe, getCachedMe, updateCachedMe, logout, ApiError, getAuthHeaders, handleAuthError } from '@/lib/api/auth';
import { getHomeData, getCachedHomeData } from '@/lib/api/topics';
import { getStudentProfile, saveStudentProfile, DEFAULT_SUBJECTS, type StudentProfile } from '@/lib/utils/studentProfile';
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
import { InstallAppButton } from '@/components/ui/InstallAppButton';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { AppInstallModal } from '@/components/ui/AppInstallModal';

const APP_VERSION = '0.1.0';

function SettingsSkeleton() {
  return (
    <div className="page-with-nav bg-bg-0">
      <div className="border-b border-border bg-bg-0 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="h-5 w-20 animate-pulse rounded bg-border-2" />
      </div>
      <div className="px-4 py-4">
        <div className="mb-4 h-20 animate-pulse rounded-xl bg-bg-3" />
        <div className="mb-4 h-36 animate-pulse rounded-xl bg-bg-3" />
        <div className="h-10 animate-pulse rounded-xl bg-bg-3" />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { isIOS, isInstalled, showInstallModal, setShowInstallModal } = usePWAInstall();
  const [me, setMe] = useState<UserMe | null>(() => getCachedMe());
  const [profile, setProfile] = useState<StudentProfile | null>(() => getStudentProfile());
  // Seed school name from session cache for instant render (SWR pattern)
  const [schoolName, setSchoolName] = useState(() => getCachedHomeData()?.school_name ?? '');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  // Pre-seed nameInput from local profile or cached /me so it's ready before /me loads
  const [nameInput, setNameInput] = useState(() => {
    const p = getStudentProfile();
    const cached = getCachedMe();
    return p?.name || cached?.name || cached?.username || '';
  });
  const [nameError, setNameError] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [pwForm, setPwForm] = useState({ new_password: '', confirm_password: '' });
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
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
        toast.info('Notifications disabled');
      } else {
        // On iOS, Web Push is only supported if added to the Home Screen
        if (isIOS && !isInstalled) {
          setShowInstallModal(true);
          toast.info('On iPhone, please add Recall to your Home Screen first to enable notifications.');
          setNotifLoading(false);
          return;
        }

        const token = await requestNotificationPermissionAndGetToken();
        if (token) {
          await registerNotificationToken(token, isIOS ? 'ios_web' : 'web');
          setNotifEnabled(true);
          toast.success('Notifications enabled');
        } else {
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied') {
            toast.error('Notifications blocked by browser. Please enable permissions in site settings.');
          } else if (isIOS && !isInstalled) {
            setShowInstallModal(true);
            toast.info('Please add Recall to your Home Screen first.');
          } else {
            toast.error('Could not enable notifications. Please grant permission.');
          }
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

      // 1. If notification token is active, send exactly one test notification via cloud push
      if (token) {
        try {
          await sendTestNotification();
          sentViaCloud = true;
          toast.success('Test notification sent to your device!');
        } catch {
          sentViaCloud = false;
        }
      }

      // 2. Only if cloud delivery was not possible (e.g. offline, local test), deliver one local notification
      if (!sentViaCloud) {
        await showLocalNotification('Recall Test Notification', {
          body: 'Push notifications are working on this device! 🎯',
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

  useEffect(() => {
    async function load() {
      setFetchError(null);
      try {
        // Fetch in parallel instead of sequential waterfall
        const [meData, homeData] = await Promise.all([getMe(), getHomeData()]);
        setMe(meData);
        setSchoolName(homeData.school_name);
        setNameInput((prev) => prev || meData.name || meData.username);
      } catch (err: unknown) {
        if (!handleAuthError(err, router)) {
          setFetchError(err instanceof Error ? err.message : 'Failed to load');
        }
      }
    }
    void load();
  }, [router, retryTick]);

  async function handleLogout() {
    setLogoutLoading(true);
    try { await logout(); } catch { /* best-effort */ }
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
      // Sync local profile & /me cache so Home and AI Tutor show the new name immediately
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
    } catch { setNameError(true); } finally { setSavingName(false); }
  }

  async function handleChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);
    if (pwForm.new_password !== pwForm.confirm_password) { setPwError('Passwords do not match'); return; }
    setPwLoading(true);
    try {
      await changePassword({ new_password: pwForm.new_password, confirm_password: pwForm.confirm_password });
      setPwSuccess(true);
      setPwForm({ new_password: '', confirm_password: '' });
    } catch (err) {
      setPwError(err instanceof ApiError && err.message ? err.message : 'Failed to change password');
    } finally { setPwLoading(false); }
  }

  if (fetchError && !me && !profile && !nameInput) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg-0 px-6 text-center">
      <p className="text-sm text-muted">{fetchError}</p>
      <button
        type="button"
        onClick={() => setRetryTick((n) => n + 1)}
        className="rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white shadow-xs active:scale-95 transition-all"
      >
        Try again
      </button>
    </div>
  );

  // Show skeleton only if we have no profile data at all to show
  if (!me && !profile && !nameInput) return <SettingsSkeleton />;

  const isIndividual = me ? me.role === 'student_individual' : !schoolName;

  return (
    <div className="page-with-nav bg-bg-0 page-enter">
      <header className="border-b border-border bg-card px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-[19px] font-bold text-ink">Settings</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-4 pb-nav">
        <div className="mb-4 overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border bg-bg-0 px-4 py-2.5">
            <span className="text-[13px] font-bold text-ink">Profile</span>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <>
                  <input value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                    className="input-field flex-1 py-1.5 text-base font-semibold" autoFocus maxLength={40} />
                  <button onClick={handleSaveName} disabled={savingName}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-ink text-white disabled:opacity-50 active:scale-95 transition-all" aria-label="Save name">
                    <Check size={16} />
                  </button>
                  <button onClick={handleCancelEdit}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border text-muted active:scale-95 transition-all" aria-label="Cancel">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-[16px] font-semibold text-ink">{nameInput}</span>
                  <button onClick={() => setIsEditingName(true)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-bg-2 active:scale-95 transition-all" aria-label="Edit name">
                    <Pencil size={15} />
                  </button>
                </>
              )}
            </div>
            {nameError && <p className="mt-1.5 text-[13px] text-danger">Could not save. Check your connection and try again.</p>}
            <p className="mt-1.5 text-[14px] text-muted">{isIndividual ? 'Independent Learner' : schoolName}</p>
          </div>
        </div>

        <div className="mb-4 overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border bg-bg-0 px-4 py-2.5">
            <span className="text-[13px] font-bold text-ink">Install App</span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="flex-1 text-[13px] text-muted leading-snug">
              Add Recall to your home screen for faster, one-tap access.
            </p>
            <InstallAppButton variant="solid" className="shrink-0 text-[12px] px-3 py-1.5" />
          </div>
        </div>

        <div className="mb-4 overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border bg-bg-0 px-4 py-2.5">
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-ink">
              <Bell size={14} /> Push Notifications
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="flex-1 text-[13px] text-muted leading-snug">
              Get daily review reminders and streak alerts on your device.
            </p>
            <button type="button" onClick={handleToggleNotifications} disabled={notifLoading}
              className={`shrink-0 min-h-[38px] rounded-lg px-3.5 py-1.5 text-[12.5px] font-bold transition-all active:scale-95 ${notifEnabled ? 'bg-brand-tint text-brand' : 'bg-ink text-white hover:bg-[#1f3029]'} disabled:opacity-60`}>
              {notifLoading ? 'Updating...' : notifEnabled ? 'Enabled' : 'Enable'}
            </button>
          </div>
          {isIOS && !isInstalled && (
            <div className="border-t border-border-2 bg-amber-50/70 px-4 py-3">
              <p className="text-[12px] font-semibold text-amber-900 leading-snug">
                iPhone Requirement: Apple requires adding Recall to your Home Screen before notifications can be delivered.
              </p>
              <button
                type="button"
                onClick={() => setShowInstallModal(true)}
                className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-bold text-ink underline"
              >
                View iPhone Home Screen Guide →
              </button>
            </div>
          )}
          {notifEnabled && (
            <div className="border-t border-border-2 bg-bg-0/60 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-muted truncate">
                  Test notification on this device
                </span>
                <button
                  type="button"
                  onClick={() => handleSendTestNotification()}
                  disabled={testNotifLoading}
                  className="shrink-0 rounded-lg border border-border-2 bg-card px-2.5 py-1 text-[11px] font-bold text-ink hover:bg-bg-1 active:scale-95 transition-all disabled:opacity-50"
                >
                  {testNotifLoading ? 'Testing…' : 'Send Test Notification'}
                </button>
              </div>
            </div>
          )}
        </div>

        {isIndividual && (
          <div className="mb-4 overflow-hidden rounded-xl border border-border-2 bg-card shadow-sm">
            <div className="border-b border-border bg-bg-0 px-4 py-2.5">
              <span className="text-[13px] font-bold text-ink">Change Password</span>
            </div>
            <form onSubmit={handleChangePassword} className="px-4 py-3">
              <div className="mb-3">
                <label className="mb-1 block text-[13px] font-semibold text-muted">New Password</label>
                <input type="password" className="input-field" value={pwForm.new_password}
                  onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))} autoComplete="new-password" required />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-[13px] font-semibold text-muted">Confirm Password</label>
                <input type="password" className="input-field" value={pwForm.confirm_password}
                  onChange={(e) => setPwForm((f) => ({ ...f, confirm_password: e.target.value }))} autoComplete="new-password" required />
              </div>
              {pwError && <p className="mb-2 text-[14px] text-danger">{pwError}</p>}
              {pwSuccess && <p className="mb-2 text-[14px] text-success">Password updated successfully.</p>}
              <button type="submit" disabled={pwLoading} className="btn-primary w-full shadow-brand-sm disabled:opacity-60">
                {pwLoading ? 'Saving...' : 'Save Password'}
              </button>
            </form>
          </div>
        )}

        {/* Help & Feedback */}
        <div className="mb-4 overflow-hidden rounded-xl border border-border-2 bg-card shadow-sm">
          <div className="border-b border-border bg-bg-0 px-4 py-2.5">
            <span className="text-[13px] font-bold text-ink">Help &amp; Feedback</span>
          </div>
          <div className="divide-y divide-border">
            <a
              href="mailto:support@definam.ng?subject=Recall%20App%20Feedback"
              className="flex items-center justify-between px-4 py-3 text-ink hover:bg-bg-1 active:bg-bg-2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-dim text-brand">
                  <MessageSquarePlus size={16} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-ink leading-tight">Send Feedback</p>
                  <p className="text-[12px] text-muted">Suggest improvements or report an issue</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted" />
            </a>

            <button
              type="button"
              onClick={() => setShowInstallModal(true)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-ink hover:bg-bg-1 active:bg-bg-2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-2 text-ink">
                  <HelpCircle size={16} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-ink leading-tight">Install App Guide</p>
                  <p className="text-[12px] text-muted">How to install Recall on iPhone or Android</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted" />
            </button>

            <a
              href="https://forms.gle/G93Xc3xbM12p1M327"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 text-ink hover:bg-bg-1 active:bg-bg-2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FEF3E2] text-[#B54708]">
                  <Bug size={16} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-ink leading-tight">Report a Bug</p>
                  <p className="text-[12px] text-muted">Something not working? Let us know</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted" />
            </a>

            <div className="flex items-center justify-between px-4 py-2.5 text-xs text-muted">
              <Link href="/terms" className="hover:text-ink hover:underline">
                Terms of Service
              </Link>
              <span>·</span>
              <Link href="/privacy" className="hover:text-ink hover:underline">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        <button type="button" onClick={() => setShowLogoutConfirm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-2 bg-card py-3.5 text-[16px] font-bold text-danger active:bg-bg-1 transition-colors">
          <LogOut size={16} strokeWidth={2} /> Log Out
        </button>

        <p className="mt-8 text-center text-[13px] text-muted">v{APP_VERSION}</p>
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60" onClick={() => setShowLogoutConfirm(false)}>
          <div className="mx-4 w-full max-w-md animate-slide-up rounded-3xl bg-bg-0 px-6 pb-6 pt-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <p className="mb-2 text-lg font-bold text-ink">Log out?</p>
            {!isIndividual && (
              <p className="mb-5 text-sm text-muted leading-snug">
                You will need your school access code to log back in.
              </p>
            )}
            <div className={`flex gap-3 ${isIndividual ? 'mt-5' : ''}`}>
              <button type="button" onClick={() => setShowLogoutConfirm(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="button" onClick={handleLogout} disabled={logoutLoading}
                className="flex-1 rounded-xl bg-danger py-3.5 text-base font-bold text-white disabled:opacity-60 active:opacity-90 transition-opacity">
                {logoutLoading ? 'Signing out...' : 'Log Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AppInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
}