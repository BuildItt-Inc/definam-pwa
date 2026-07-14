'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { changePassword, getMe, logout, ApiError } from '@/lib/api/auth';
import { getHomeData } from '@/lib/api/topics';
import type { UserMe } from '@/types/auth';
import { BottomNav } from '@/components/student/BottomNav';

const APP_VERSION = '0.1.0';

// ── Skeleton ───────────────────────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="border-b border-gray-200/60 bg-cream px-4 py-3.5">
        <div className="h-5 w-20 animate-pulse rounded bg-gray-300/50" />
      </div>
      <div className="px-4 py-4 pb-24">
        <div className="mb-4 h-20 animate-pulse rounded-xl bg-gray-300/40" />
        <div className="mb-4 h-36 animate-pulse rounded-xl bg-gray-300/40" />
        <div className="h-10 animate-pulse rounded-xl bg-gray-300/40" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();

  const [me, setMe] = useState<UserMe | null>(null);
  const [schoolName, setSchoolName] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Inline name edit
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  // Password change (individual only)
  const [pwForm, setPwForm] = useState({ new_password: '', confirm_password: '' });
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const meData = await getMe();
        const homeData = await getHomeData();
        setMe(meData);
        setSchoolName(homeData.school_name);
        setNameInput(meData.username);
      } catch (err: unknown) {
        const is401 =
          err instanceof Error &&
          (err.message === 'Not authenticated' || (err as { status?: number }).status === 401);
        if (is401) {
          router.replace('/login');
        } else {
          setFetchError(err instanceof Error ? err.message : 'Failed to load');
        }
      }
    }
    void load();
  }, [router]);

  async function handleLogout() {
    setLogoutLoading(true);
    try {
      await logout();
    } catch {
      // best-effort — clear cookie on server, redirect regardless
    }
    router.replace('/login');
  }

  function handleCancelEdit() {
    setNameInput(me?.username ?? '');
    setIsEditingName(false);
  }

  async function handleSaveName() {
    // TODO: No update-name endpoint exists yet. Not wired up.
    console.log('TODO: update name endpoint not yet implemented', nameInput);
    setIsEditingName(false);
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
    } catch (err) {
      setPwError(
        err instanceof ApiError && err.message
          ? err.message
          : 'Failed to change password',
      );
    } finally {
      setPwLoading(false);
    }
  }

  if (fetchError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-6">
        <p className="text-center font-dm-sans text-sm text-muted">{fetchError}</p>
      </div>
    );
  }

  if (!me) return <SettingsSkeleton />;

  const isIndividual = me.role === 'student_individual';

  return (
    <div className="flex min-h-screen flex-col bg-cream">

      {/* Appbar */}
      <header className="border-b border-gray-200/60 bg-cream px-4 py-3.5">
        <h1 className="font-syne text-[17px] font-bold text-ink">Settings</h1>
      </header>

      <main className="flex-1 px-4 py-4 pb-24">

        {/* ── Profile card ──────────────────────────────────────────────── */}
        <div className="mb-4 overflow-hidden rounded-xl border border-border-2 bg-card">
          <div className="border-b border-border bg-bg-0 px-4 py-2.5">
            <span className="font-dm-sans text-[11px] font-bold text-ink">Profile</span>
          </div>
          <div className="px-4 py-3">
            {/* Name edit UI (Pencil button + isEditingName branch) is hidden until
                PATCH /api/v1/students/me exists. handleSaveName, handleCancelEdit,
                and the associated state are kept below, ready to wire up. */}
            <div className="flex items-center gap-2">
              <span className="flex-1 font-dm-sans text-[14px] font-semibold text-ink">
                {nameInput}
              </span>
            </div>
            <p className="mt-1.5 font-dm-sans text-[12px] text-muted">
              {isIndividual ? 'Independent Learner' : schoolName}
            </p>
          </div>
        </div>

        {/* ── Change Password (individual only) ─────────────────────────── */}
        {isIndividual && (
          <div className="mb-4 overflow-hidden rounded-xl border border-border-2 bg-card">
            <div className="border-b border-border bg-bg-0 px-4 py-2.5">
              <span className="font-dm-sans text-[11px] font-bold text-ink">
                Change Password
              </span>
            </div>
            <form onSubmit={handleChangePassword} className="px-4 py-3">
              <div className="mb-3">
                <label className="mb-1 block font-dm-sans text-[11px] text-muted">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-border-2 bg-bg-0 px-3 py-2 font-dm-sans text-[13px] text-ink outline-none focus:border-jade"
                  value={pwForm.new_password}
                  onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block font-dm-sans text-[11px] text-muted">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-border-2 bg-bg-0 px-3 py-2 font-dm-sans text-[13px] text-ink outline-none focus:border-jade"
                  value={pwForm.confirm_password}
                  onChange={(e) =>
                    setPwForm((f) => ({ ...f, confirm_password: e.target.value }))
                  }
                  autoComplete="new-password"
                  required
                />
              </div>
              {pwError && (
                <p className="mb-2 font-dm-sans text-[12px] text-coral">{pwError}</p>
              )}
              {pwSuccess && (
                <p className="mb-2 font-dm-sans text-[12px] text-jade">
                  Password updated successfully.
                </p>
              )}
              <button
                type="submit"
                disabled={pwLoading}
                className="w-full rounded-lg bg-jade py-2.5 font-dm-sans text-[13px] font-bold text-white disabled:opacity-60"
              >
                {pwLoading ? 'Saving…' : 'Save Password'}
              </button>
            </form>
          </div>
        )}

        {/* ── Log out ───────────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-2 bg-card py-3 font-dm-sans text-[13px] font-bold text-coral"
        >
          <LogOut size={16} strokeWidth={1.5} />
          Log Out
        </button>

        {/* App version */}
        <p className="mt-8 text-center font-dm-sans text-[11px] text-muted">
          v{APP_VERSION}
        </p>

      </main>

      <BottomNav />

      {/* ── Logout confirmation sheet ────────────────────────────────────── */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-card px-5 pb-8 pt-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-5 font-dm-sans text-[14px] font-semibold text-ink">
              {isIndividual
                ? 'Log out?'
                : 'You’ll need your access code to log back in. Log out?'}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl border border-border-2 py-3 font-dm-sans text-[13px] font-bold text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutLoading}
                className="flex-1 rounded-xl bg-coral py-3 font-dm-sans text-[13px] font-bold text-white disabled:opacity-60"
              >
                {logoutLoading ? 'Signing out…' : 'Log Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
