'use client';

import { useEffect } from 'react';
import { applyTheme, getThemePreference, subscribeToTheme } from '@/lib/theme';

export default function ThemeSync() {
  useEffect(() => {
    applyTheme(getThemePreference());
    return subscribeToTheme(() => {
      // System changes already apply the class inside subscribeToTheme.
    });
  }, []);

  return null;
}
