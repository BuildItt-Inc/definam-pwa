'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Pencil, Check, X, Bell } from 'lucide-react';
import { changePassword, getMe, logout, ApiError, getAuthHeaders } from '@/lib/api/auth';
import { getHomeData } from '@/lib/api/topics';
import { getStudentProfile, type StudentProfile } from '@/lib/utils/studentProfile';
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
  const [me, setMe] = useState<UserMe | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(() => getStudentProfile());
  const [schoolName, setSchoolName] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
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

  async function handleSendTestNotification(delaySec: number = 0) {
    setTestNotifLoading(true);
    try {
      if (delaySec > 0) {
        toast.info(`Test notification will fire in ${delaySec}s! Lock your phone or switch apps now.`);
        await new Promise((resolve) => setTimeout(resolve, delaySec * 1000));
      }

      // 1. Direct on-device notification via Service Worker
      const localDelivered = await showLocalNotification('Recall Test Notification', {
        body: 'Push notifications are working on this device! 🎯',
        tag: 'recall-test-alert',
      });

      // 2. Also trigger cloud backend push delivery
      await sendTestNotification().catch(() => {});

      if (localDelivered) {
        toast.success('Test notification delivered to your device!');
      } else {
        toast.success('Test notification sent. Check your notification center.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send test notification');
    } finally {
      setTestNotifLoading(false);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const meData = await getMe();
        const homeData = await getHomeData();
        setMe(meData);
        setSchoolName(homeData.school_name);
        setNameInput(meData.name || meData.username);
      } catch (err: unknown) {
        const is401 = err instanceof Error && (err.message === 'Not authenticated' || (err as { status?: number }).status === 401);
        if (is401) { router.replace('/login'); } else { setFetchError(err instanceof Error ? err.message : 'Failed to load'); }
      }
    }
    void load();
  }, [router]);

  async function handleLogout() {
    setLogoutLoading(true);
    try { await logout(); } catch { /* best-effort */ }
    router.replace('/login');
  }

  function handleCancelEdit() {
    setNameInput(me?.name || me?.username || '');
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
      setIsEditingName(false);
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

  if (fetchError) return (
    <div className="flex min-h-screen items-center justify-center bg-bg-0 px-6">
      <p className="text-center text-sm text-muted">{fetchError}</p>
    </div>
  );

  if (!me) return <SettingsSkeleton />;

  const isIndividual = me.role === 'student_individual';

  return (
    <div className="page-with-nav bg-bg-0 page-enter">
      <header className="border-b border-border px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)]">
        <h1 className="text-[17px] font-bold text-ink">Settings</h1>
      </header>

      <main className="flex-1 px-4 pt-4 pb-nav">
        <div className="mb-4 overflow-hidden rounded-xl border border-border-2 bg-card shadow-sm">
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
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand text-white disabled:opacity-50" aria-label="Save name">
                    <Check size={16} />
                  </button>
                  <button onClick={handleCancelEdit}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border-2 text-muted" aria-label="Cancel">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-[16px] font-semibold text-ink">{nameInput}</span>
                  <button onClick={() => setIsEditingName(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted active:bg-bg-2 transition-colors" aria-label="Edit name">
                    <Pencil size={15} />
                  </button>
                </>
              )}
            </div>
            {nameError && <p className="mt-1.5 text-[13px] text-danger">Could not save. Check your connection and try again.</p>}
            <p className="mt-1.5 text-[14px] text-muted">{isIndividual ? 'Independent Learner' : schoolName}</p>
          </div>
        </div>

        {/* Curriculum & Subjects */}
        <div className="mb-4 overflow-hidden rounded-xl border border-border-2 bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border bg-bg-0 px-4 py-2.5">
            <span className="text-[13px] font-bold text-ink">My Curriculum & Subjects</span>
            <Link
              href="/student/subjects"
              className="text-xs font-bold text-brand hover:underline"
            >
              Manage Subjects
            </Link>
          </div>
          <div className="px-4 py-3">
            {profile ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-muted">Class & Targets</span>
                  <span className="font-bold text-ink">
                    {profile.class_level || 'SS3'}{profile.targets?.length ? ` · ${profile.targets.join(', ')}` : ''}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted mb-2">
                    Active Subjects ({profile.selectedSubjects?.length || 0})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.selectedSubjects && profile.selectedSubjects.length > 0 ? (
                      profile.selectedSubjects.map((s: string) => (
                        <span
                          key={s}
                          className="rounded-lg bg-bg-2 border border-border px-2.5 py-1 text-xs font-semibold text-ink"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted">All subjects active</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Custom curriculum not set</span>
                <Link
                  href="/student/subjects"
                  className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white shadow-2xs"
                >
                  Set Up Curriculum
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4 overflow-hidden rounded-xl border border-border-2 bg-card shadow-sm">
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

        <div className="mb-4 overflow-hidden rounded-xl border border-border-2 bg-card shadow-sm">
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
              className={`shrink-0 rounded-xl px-3 py-1.5 text-[12px] font-bold transition-colors ${notifEnabled ? 'bg-brand-tint text-brand active:bg-brand-tint-b' : 'bg-brand text-white active:bg-brand-dark'} disabled:opacity-60`}>
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
            <div className="border-t border-border-2 bg-bg-0/60 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-muted truncate">
                  Test instant alert
                </span>
                <button
                  type="button"
                  onClick={() => handleSendTestNotification(0)}
                  disabled={testNotifLoading}
                  className="shrink-0 rounded-lg border border-border-2 bg-card px-2.5 py-1 text-[11px] font-bold text-ink hover:bg-bg-1 active:scale-95 transition-all disabled:opacity-50"
                >
                  {testNotifLoading ? 'Testing…' : 'Send Test Now'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2">
                <span className="text-[12px] text-muted truncate">
                  Test lock screen banner (5s delay)
                </span>
                <button
                  type="button"
                  onClick={() => handleSendTestNotification(5)}
                  disabled={testNotifLoading}
                  className="shrink-0 rounded-lg border border-border-2 bg-card px-2.5 py-1 text-[11px] font-bold text-ink hover:bg-bg-1 active:scale-95 transition-all disabled:opacity-50"
                >
                  {testNotifLoading ? 'Scheduling…' : 'Test Lock Screen'}
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