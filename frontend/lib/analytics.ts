/**
 * Client-side PostHog analytics wrapper.
 * Lazily loads posthog-js only on the browser and only when NEXT_PUBLIC_POSTHOG_KEY is set.
 * Safely no-ops in development, SSR, or when analytics is not configured.
 */

let posthogInstance: typeof import('posthog-js').default | null = null;
let isInitialized = false;

export async function getPostHog() {
  if (typeof window === 'undefined') return null;
  if (posthogInstance) return posthogInstance;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  try {
    const mod = await import('posthog-js');
    const ph = mod.default || mod;
    if (!isInitialized) {
      ph.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: false, // Explicit events only for performance & privacy
      });
      isInitialized = true;
    }
    posthogInstance = ph;
    return ph;
  } catch (e) {
    console.warn('[analytics] PostHog init notice:', e);
    return null;
  }
}

export async function identifyUser(userId: string, traits?: Record<string, unknown>) {
  const ph = await getPostHog();
  if (!ph) return;
  ph.identify(userId, traits);
}

export async function resetAnalytics() {
  const ph = await getPostHog();
  if (!ph) return;
  ph.reset();
}

export async function trackEvent(name: string, properties?: Record<string, unknown>) {
  const ph = await getPostHog();
  if (!ph) return;
  ph.capture(name, properties);
}

// ── Standard Platform Funnel Events ───────────────────────────────────────

export const AnalyticsEvents = {
  /** User completes signup or initial registration */
  signup: (props: { role: string; school_name?: string | null; source?: string }) => {
    void trackEvent('signup', props);
  },

  /** Access code redeemed (individual or school org code) */
  codeRedeemed: (props: { code_type?: string; school_id?: string | null; code_prefix?: string }) => {
    void trackEvent('code_redeemed', props);
  },

  /** Student opens and begins reading a learning topic */
  topicOpened: (props: { topic_id: string; title?: string; subject?: string; grade_level?: string }) => {
    void trackEvent('topic_opened', props);
  },

  /** Student finishes step 4 practice questions */
  practiceFinished: (props: { topic_id: string; score: number; total: number; passed: boolean }) => {
    void trackEvent('practice_finished', props);
  },

  /** Student finishes SM-2 spaced repetition review */
  reviewCompleted: (props: { topic_id: string; quality: number; repetitions: number; interval_days?: number }) => {
    void trackEvent('review_completed', props);
  },
};
