# Week 1 Auth Screens — DefinAm PWA

Handover document for the frontend auth foundation built across feature branches
`feature/week1-auth-web` (web auth flows) and `feature/week1-f1-mobile-screens`
(mobile org-student entry).  
Covers every screen, file, API call, and decision made this sprint.

---

## 1. Overview

Week 1 built the complete pre-login layer of the DefinAm PWA: landing page, all
three payment flows (individual, organisation, shared Paystack callback),
individual registration, individual login, admin login with forced password change,
and the two F1 mobile org-student screens (PWA splash + access code entry).

All pages are Next.js 15 App Router, TypeScript strict, Tailwind CSS only (no
external UI library). Auth tokens are held in a module-level in-memory variable
inside `lib/api/auth.ts` — never written to `localStorage`, `sessionStorage`, or
`document.cookie`. The backend sets an httpOnly refresh token cookie automatically
on every successful login; the frontend uses it via `refreshToken()` to silently
renew access tokens.

---

## 2. Screens built

| Screen ID | Route | File path | Description | Status |
|-----------|-------|-----------|-------------|--------|
| SCR-01 | `/` | `app/page.tsx` | Landing page — three CTAs for individual pay, org pay, login | ✅ Done |
| SCR-02a-i | `/pay/individual` | `app/(auth)/pay/individual/page.tsx` | Individual payment — email input, ₦1,700 price card, Paystack redirect | ✅ Done |
| SCR-02a-ii | `/register` | `app/(auth)/register/page.tsx` | Individual registration — username, password, access code | ✅ Done |
| SCR-02b | `/pay/organisation` | `app/(auth)/pay/organisation/page.tsx` | Org payment — school details form, real-time price calculator | ✅ Done |
| SCR-02b (callback) | `/pay/callback` | `app/(auth)/pay/callback/page.tsx` | Shared Paystack callback — verifies payment, branches on flow type | ✅ Done |
| SCR-03a | `/login` | `app/(auth)/login/page.tsx` | Individual login — username + password | ✅ Done |
| SCR-03b | `/mobile/code` | `app/(auth)/mobile/code/page.tsx` | Org student code entry — access code is the permanent login credential | ✅ Done |
| SCR-03c | `/mobile` | `app/(auth)/mobile/page.tsx` | Mobile PWA splash — dark full-viewport, two CTAs | ✅ Done |
| SCR-03d | `/admin/login` | `app/(auth)/admin/login/page.tsx` | Admin login + conditional force-password-change block | ✅ Done |

No screens remain in F1 scope. F2 items are listed in section 9.

---

## 3. File structure

Files created or modified this sprint only. Pre-existing scaffold files are
excluded.

```
frontend/
├── app/
│   ├── page.tsx                        # SCR-01: Landing page (server component)
│   ├── layout.tsx                      # Modified: added Syne + DM Sans via next/font
│   └── (auth)/
│       ├── mobile/
│       │   ├── page.tsx                # SCR-03c: Mobile PWA splash (server component)
│       │   └── code/
│       │       └── page.tsx            # SCR-03b: Org student access code entry
│       ├── login/
│       │   └── page.tsx                # SCR-03a: Individual login
│       ├── admin/
│       │   └── login/
│       │       └── page.tsx            # SCR-03d: Admin login + force PW change
│       ├── register/
│       │   └── page.tsx                # SCR-02a-ii: Individual registration
│       └── pay/
│           ├── individual/
│           │   └── page.tsx            # SCR-02a-i: Individual payment
│           ├── organisation/
│           │   └── page.tsx            # SCR-02b: Organisation payment
│           └── callback/
│               └── page.tsx            # Shared: Paystack callback handler
├── lib/
│   ├── api/
│   │   ├── auth.ts                     # loginUser, adminLogin, changePassword,
│   │   │                               #   registerUser, orgLogin, refreshToken,
│   │   │                               #   logout, getAccessToken
│   │   └── payment.ts                  # initializeIndividualPayment,
│   │                                   #   initializeOrgPayment, verifyPayment
│   └── validations/
│       └── auth.ts                     # loginSchema, adminLoginSchema,
│                                       #   changePasswordSchema, registerSchema,
│                                       #   orgLoginSchema
├── types/
│   ├── auth.ts                         # LoginRequest/Response, AdminLoginRequest,
│   │                                   #   AdminLoginResponse, ChangePasswordRequest,
│   │                                   #   RegisterRequest/Response,
│   │                                   #   OrgLoginRequest/Response
│   └── payment.ts                      # InitializePaymentResponse,
│                                       #   InitializeOrgPaymentResponse,
│                                       #   VerifyPaymentResponse,
│                                       #   InitializeOrgPaymentRequest,
│                                       #   VerifyOrgPaymentResponse
├── next.config.js                      # reactStrictMode only (rewrite proxy removed)
└── tailwind.config.ts                  # Modified: font families use CSS vars
```

---

## 4. Auth flows

### Individual — Pay → Register → Login

1. User lands on `/` and clicks "Pay as an Individual."
2. `/pay/individual` renders a fixed ₦1,700 price card and an email input. On
   submit, `POST /api/v1/payments/individual` is called with `{ email }`. On
   success, `reference` and `payment_type = 'individual'` are written to
   `sessionStorage` and the browser hard-navigates to the returned
   `authorization_url`.
3. Paystack processes the payment and redirects to `/pay/callback?reference=xxx`.
   The callback page reads `payment_type` from `sessionStorage` (defaults to
   `'individual'`), then calls `GET /api/v1/payment/verify?reference=xxx`. On
   success the response includes an `email` field confirming where the access code
   was sent.
4. The user navigates to `/register`, fills in username, password, confirm
   password, and the access code emailed by the backend. On submit,
   `POST /api/v1/auth/register` is called. The returned `access_token` is stored
   in the in-memory variable inside `lib/api/auth.ts`. The user is redirected to
   `/dashboard`.
5. On subsequent visits the user logs in at `/login` with username + password.
   Same token-in-memory → `router.push('/dashboard')` flow.

### Org Student — Mobile PWA Entry (F1 mobile, newly built)

1. An org student installs the DefinAm PWA on their device. The app opens to
   `/mobile` (SCR-03c) — a full-viewport dark screen (`bg-ink`, `h-dvh`) with the
   DefinAm logo, tagline, a bordered quote pill, and two CTAs.
2. The student taps **"Enter with Access Code"** → `/mobile/code` (SCR-03b).
3. The student enters their access code (format `[A-Z]{2,3}-\d{4}-[A-Z]{2}`,
   e.g. `DA-8472-KX`) in the styled code box. On submit the page collects
   `navigator.userAgent` (read inside `onSubmit`, not on mount, to avoid SSR)
   and calls `POST /api/v1/auth/org-login` with
   `{ access_code, user_agent, ip: '0.0.0.0' }`. The backend resolves the real
   IP server-side.
4. On success the `access_token` is stored in memory and the student is redirected
   to `/dashboard`.
5. On 400 or 422, a coral error banner shows "Invalid or already used access
   code."

**Org student auth model:** the access code is both the activation credential and
the permanent login credential. No username or password is ever set. On first use
the backend auto-creates the student account; on return visits it issues a fresh
session token for the same code.

The **"Login (Individual)"** CTA on `/mobile` links to `/login` as a fallback for
individual subscribers who access DefinAm through the PWA rather than the browser.

### Admin — Login → Force Password Change → Dashboard

1. Admin visits `/admin/login` and enters their school email and the temporary
   password emailed by the backend after org payment.
2. `POST /api/v1/auth/admin/login` returns
   `{ access_token, role, force_password_change }`. The `access_token` is stored
   in memory.
3. If `force_password_change` is `false`, the admin is redirected to
   `/admin/dashboard`.
4. If `force_password_change` is `true`, the login form is hidden and the
   change-password block appears on the same page (no route change). A gold
   `AlertTriangle` banner explains the situation.
5. On submit, `POST /api/v1/auth/change-password` is called with
   `{ new_password, confirm_password }` and
   `Authorization: Bearer <access_token>`. On success the admin is redirected to
   `/admin/dashboard`.

---

## 5. API endpoints consumed

All external fetch calls target `${process.env.NEXT_PUBLIC_API_URL}/api/v1/...`.
All non-2xx responses throw a typed `ApiError` (auth) or `PaymentError` (payment)
with the HTTP status code attached, enabling precise per-status error handling in
page components.

| Endpoint | Method | Client function | Auth | Purpose |
|----------|--------|-----------------|------|---------|
| `/api/v1/auth/login` | POST | `loginUser` | None | Individual login — returns `access_token`, `role`, `force_password_change` |
| `/api/v1/auth/admin/login` | POST | `adminLogin` | None | Admin login — same response shape as individual login |
| `/api/v1/auth/change-password` | POST | `changePassword` | Bearer | Set permanent password; body includes `new_password` + `confirm_password` |
| `/api/v1/auth/register` | POST | `registerUser` | None | Create individual account; validates access code; returns `access_token` |
| `/api/v1/auth/org-login` | POST | `orgLogin` | None | Org student login via access code; body: `{ access_code, user_agent, ip }` |
| `/api/v1/auth/refresh` | POST | `refreshToken` | Cookie | Silently renew access token using the httpOnly refresh cookie |
| `/api/v1/auth/logout` | POST | `logout` | Bearer + Cookie | Clear server-side refresh cookie; wipes in-memory token |
| `/api/v1/payments/individual` | POST | `initializeIndividualPayment` | None | Create Paystack transaction; body `{ email }`; returns `authorization_url` + `reference` |
| `/api/v1/payments/organisation` | POST | `initializeOrgPayment` | None | Bulk org seat purchase; returns `authorization_url`, `reference`, `total_amount_naira` |
| `/api/v1/payment/verify` | GET | `verifyPayment` | None | Confirm Paystack webhook received; returns email (individual) or org details |

---

## 6. Token storage strategy

### Access token — in-memory only

The access token is stored in a module-level variable inside `lib/api/auth.ts`:

```ts
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}
```

It is set by `loginUser`, `adminLogin`, `registerUser`, and `orgLogin`
immediately after a successful API response, and cleared by `logout`. It is
**never** written to `localStorage`, `sessionStorage`, or `document.cookie`.

Authenticated endpoints receive it via the `Authorization` header:

```ts
headers: { Authorization: `Bearer ${accessToken}` }
```

### Refresh token — httpOnly cookie (backend-managed)

The backend sets an httpOnly refresh token cookie automatically on every
successful login. The cookie is inaccessible to JavaScript. When the access token
needs renewal (e.g. after a page reload), the frontend calls:

```ts
await refreshToken(); // POST /api/v1/auth/refresh, credentials: 'include'
```

The browser sends the refresh cookie automatically because `credentials: 'include'`
is set. The backend returns a new `access_token` which is stored in memory.

### Why not localStorage

`localStorage` is readable by any JavaScript running on the page. A single XSS
vector — an injected `<script>`, a compromised dependency, or a reflected-XSS
payload — can silently exfiltrate the token. The in-memory variable is wiped on
page reload, limiting the window of exposure. The httpOnly cookie physically
cannot be read by JavaScript regardless of what code runs in the browser.

### Trade-off: access token is lost on reload

Because `accessToken` lives in a module variable it is cleared whenever the page
is reloaded or the user opens a new tab. Every protected layout must call
`refreshToken()` on mount to silently restore a working token from the httpOnly
refresh cookie. This wiring is **not yet built** — it is the primary gap before
any protected route can ship (see section 9).

---

## 7. Design tokens used

All five tokens are configured in `tailwind.config.ts` and referenced as Tailwind
utility classes throughout every screen.

| Token | Hex | Applied on |
|-------|-----|------------|
| `ink` | `#0A0F1E` | Landing page + mobile splash background; heading text on cream screens; input text colour |
| `cream` | `#F5F0E8` | Page background for all web auth screens; app bar background |
| `jade` | `#1B6B4A` | Primary CTA buttons; logo container; active/focus field borders; field labels; links; icon accents; success states; code input box border |
| `gold` | `#C8973A` | Warning banner in admin login force-password-change block |
| `coral` | `#E85D3A` | Field validation errors; error banners; field border on validation failure; payment verification error |

Fonts are loaded via `next/font/google` in `app/layout.tsx` and exposed as CSS
variables:

| Variable | Font | Tailwind class | Used on |
|----------|------|----------------|---------|
| `--font-syne` | Syne | `font-syne` | `<h1>` headings; mobile splash wordmark; price displays |
| `--font-dm-sans` | DM Sans | `font-dm-sans` | Body text, labels, buttons — everything that is not a heading |

---

## 8. Environment variables required

```dotenv
# Base URL of the FastAPI backend — no trailing slash.
# Used for all API calls in lib/api/auth.ts and lib/api/payment.ts.
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Paystack callback URL** — register in the Paystack dashboard under
**Settings → API Keys & Webhooks → Callback URL**:

- Development: `http://localhost:3000/pay/callback`
- Production: `https://definam.ng/pay/callback`

Paystack appends `?reference=xxx` after payment. The callback page reads it from
the query string.

---

## 9. Known gaps and next steps

### Hard gaps — must be addressed before protected routes ship

| Gap | Location | Detail |
|-----|----------|--------|
| Access token lost on reload | `lib/api/auth.ts` | `accessToken` is an in-memory variable wiped on every page reload or new tab. A protected root layout must call `refreshToken()` on mount to silently restore it from the httpOnly refresh cookie. Until this is wired, every protected page will 401 immediately after a hard refresh. |
| `refreshToken` requires CORS credentials | `lib/api/auth.ts::refreshToken` | `refreshToken()` calls the backend with `credentials: 'include'`. If the backend and Next.js run on different origins the browser will block the cookie. The backend must respond with `Access-Control-Allow-Origin: <next-origin>` and `Access-Control-Allow-Credentials: true` — a wildcard `*` origin will not work alongside credentials. |
| Paystack callback URL not registered | Paystack dashboard | Payment redirect will 404 until `http://localhost:3000/pay/callback` is registered. See section 8. |

### Soft gaps — routes referenced but not built

| Gap | Location | Detail |
|-----|----------|--------|
| Forgot password flow | `app/(auth)/login/page.tsx` | Link `href="/forgot-password"` exists but the route has no page. Clicking it will 404. |
| `/dashboard` redirect target | `login`, `register`, `mobile/code` pages | All three call `router.push('/dashboard')` on success. Route does not exist yet. |
| `/admin/dashboard` redirect target | `admin/login/page.tsx` | Both the normal login path and post-password-change call `router.push('/admin/dashboard')`. Route does not exist yet. |

### Out of scope (F2)

| Item | Notes |
|------|-------|
| Refresh token wiring | `refreshToken()` is implemented but called nowhere. Needs a root protected layout or middleware before dashboard routes ship. |
| Logout UI | `logout()` is implemented in `lib/api/auth.ts` but no button or route triggers it yet. |
| Org student web fallback | SCR-03b is built as a mobile PWA screen. A browser-accessible fallback for org students who do not install the PWA is not scoped. |
| SCR-03b new-device handling | On a new device the backend revokes the old session and stores a new `device_fingerprint`. The frontend currently has no UI for this state — it falls through to a generic error banner. |
