'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Pencil, Check, X, Bell } from 'lucide-react';
import { changePassword, getMe, logout, ApiError, getAuthHeaders } from '@/lib/api/auth';
import { getHomeData } from '@/lib/api/topics';
import {
  requestNotificationPermissionAndGetToken,
  getStoredFcmToken,
  clearStoredFcmToken,
} from '@/lib/firebase';
import { registerNotificationToken, unregisterNotificationToken } from '@/lib/api/notifications';
import type { UserMe } from '@/types/auth';
import { BottomNav } from '@/components/student/BottomNav';
import { InstallAppButton } from '@/components/ui/InstallAppButton';

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
  const [me, setMe] = useState<UserMe | null>(null);
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

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifEnabled(Notification.permission === 'granted' && !!getStoredFcmToken());
    }
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
      } else {
        const token = await requestNotificationPermissionAndGetToken();
        if (token) {
          await registerNotificationToken(token, 'web');
          setNotifEnabled(true);
        }
      }
    } catch { /* best effort */ } finally {
      setNotifLoading(false);
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

        <div className="mb-4 overflow-hidden rounded-xl border border-border-2 bg-card shadow-sm">
          <div className="border-b border-border bg-bg-0 px-4 py-2.5">
            <span className="text-[13px] font-bold text-ink">Install App</span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="flex-1 text-[13px] text-muted leading-snug">
              Add Recall to your home screen for faster access. Works offline too.
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

      <BottomNav />

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
    </div>
  );
}