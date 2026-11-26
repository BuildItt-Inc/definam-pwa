export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'recall-theme-preference';
export const THEME_CHANGE_EVENT = 'recall:theme-change';

const VALID_PREFERENCES = new Set<ThemePreference>(['light', 'dark', 'system']);

export function getThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (raw && VALID_PREFERENCES.has(raw as ThemePreference)) {
      return raw as ThemePreference;
    }
  } catch {
    // ignore storage errors
  }
  return 'system';
}

export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === 'dark' || pref === 'light') return pref;
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(pref: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(pref);
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', resolved === 'dark' ? '#0B0E0D' : '#14201B');
    }
  }
  return resolved;
}

export function setThemePreference(pref: ThemePreference): ResolvedTheme {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch {
      // ignore storage errors
    }
    const resolved = applyTheme(pref);
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { pref, resolved } }));
    return resolved;
  }
  return 'light';
}

export function subscribeToTheme(listener: (pref: ThemePreference, resolved: ResolvedTheme) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const notify = () => {
    const pref = getThemePreference();
    listener(pref, resolveTheme(pref));
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) notify();
  };
  const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
  const onMediaChange = () => {
    if (getThemePreference() === 'system') {
      applyTheme('system');
      notify();
    }
  };
  window.addEventListener(THEME_CHANGE_EVENT, notify);
  window.addEventListener('storage', onStorage);
  mql?.addEventListener('change', onMediaChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, notify);
    window.removeEventListener('storage', onStorage);
    mql?.removeEventListener('change', onMediaChange);
  };
}
