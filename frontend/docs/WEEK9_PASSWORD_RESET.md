# Week 9 — Password Reset Flow

## What was built

End-to-end password reset for individual users only (org students are password-less and never see these pages).

## Files changed

| File | Change |
|---|---|
| `types/auth.ts` | Added `ForgotPasswordRequest`, `ResetPasswordRequest` interfaces |
| `lib/validations/auth.ts` | Added `forgotPasswordSchema` / `ForgotPasswordFormValues` |
| `lib/api/auth.ts` | Added `forgotPassword`, `resetPassword` API client functions |
| `app/(auth)/forgot-password/page.tsx` | New page — email entry, always-200 success message |
| `app/(auth)/reset-password/page.tsx` | New page — token + new/confirm password, token-expiry handling |
| `app/(auth)/login/page.tsx` | Restored "Forgot password?" link (mb-7); added reset success banner |

## Design decisions

- **forgot-password**: Endpoint always returns 200 to prevent account enumeration. Success state shows "If an account exists for that email, we've sent a reset link" — not a confirmation that the email was found.
- **reset-password**: `useSearchParams` is called inside a `<Suspense>`-wrapped inner component (`ResetPasswordForm`) as required by Next.js 15 for SSR-safe rendering.
- Token errors (400/401/410/422) flip a `tokenInvalid` state to show the "Link expired or already used" screen with a link back to `/forgot-password`. Network/5xx errors show the generic banner.
- Success redirects to `/login?reset=1`; the login page reads that param via a separate `ResetSuccessBanner` component (also Suspense-wrapped) and shows a jade-coloured success banner.
- Reset-password page reuses `changePasswordSchema` (already enforces uppercase + number requirements).

## Gaps / follow-ups

- The `/api/v1/auth/forgot-password` and `/api/v1/auth/reset-password` backend routes must exist; this PR only adds the frontend.
- If the backend returns a specific error code for "token already used" vs "expired", the token-invalid screen copy could be made more precise.
