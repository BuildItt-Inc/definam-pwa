# Week 1 Auth Screens — DefinAm PWA

Handover document for the frontend auth foundation built in feature branch `feature/week1-auth-web`.  
Covers every screen, file, API call, and decision made this week.

---

## 1. Overview

Week 1 built the complete pre-login layer of the DefinAm PWA: landing page, all three payment flows (individual, organisation, shared Paystack callback), individual registration, individual login, and admin login with forced password change. These screens have no dependency on the student dashboard or backend beyond the seven API endpoints listed in section 5.

All pages are Next.js 15 App Router, TypeScript strict, Tailwind CSS only (no external UI library). Auth state is held exclusively in an `httpOnly` cookie named `definam_token` set server-side via a Next.js Route Handler. No token is ever exposed to browser JavaScript.

---

## 2. Screens built

| Screen ID | Route | File path | Description | Status |
|-----------|-------|-----------|-------------|--------|
| SCR-01 | `/` | `app/page.tsx` | Landing page — three CTAs for individual pay, org pay, login | ✅ Done |
| SCR-02a-i | `/pay/individual` | `app/(auth)/pay/individual/page.tsx` | Individual payment — fixed ₦1,700 price card, Paystack redirect | ✅ Done |
| SCR-02a-ii | `/register` | `app/(auth)/register/page.tsx` | Individual registration — username, password, access code | ✅ Done |
| SCR-02b | `/pay/organisation` | `app/(auth)/pay/organisation/page.tsx` | Org payment — school details form, real-time price calculator | ✅ Done |
| SCR-02b (callback) | `/pay/callback` | `app/(auth)/pay/callback/page.tsx` | Shared Paystack callback — verifies payment, branches on flow type | ✅ Done |
| SCR-03a | `/login` | `app/(auth)/login/page.tsx` | Individual login — username + password | ✅ Done |
| SCR-03d | `/admin/login` | `app/(auth)/admin/login/page.tsx` | Admin login + conditional force-password-change block | ✅ Done |

**Not built this week (F2 scope):**

| Screen ID | Route | Description |
|-----------|-------|-------------|
| SCR-03b | TBD | Org student login — access code entry (mobile app) |
| SCR-03c | TBD | Mobile splash screen for org students |

---

## 3. File structure

Files created or modified this week only. Pre-existing scaffold files are excluded.

```
frontend/
├── app/
│   ├── page.tsx                        # SCR-01: Landing page (server component)
│   ├── layout.tsx                      # Modified: added Syne + DM Sans via next/font
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx                # SCR-03a: Individual login
│   │   ├── admin/
│   │   │   └── login/
│   │   │       └── page.tsx            # SCR-03d: Admin login + force PW change
│   │   ├── register/
│   │   │   └── page.tsx                # SCR-02a-ii: Individual registration
│   │   └── pay/
│   │       ├── individual/
│   │       │   └── page.tsx            # SCR-02a-i: Individual payment
│   │       ├── organisation/
│   │       │   └── page.tsx            # SCR-02b: Organisation payment
│   │       └── callback/
│   │           └── page.tsx            # Shared: Paystack callback handler
│   └── api/
│       └── auth/
│           └── set-cookie/
│               └── route.ts            # Route Handler: sets httpOnly cookie
├── lib/
│   ├── api/
│   │   ├── auth.ts                     # API client: loginUser, adminLogin,
│   │   │                               #   changePassword, registerUser
│   │   └── payment.ts                  # API client: initializeIndividualPayment,
│   │                                   #   initializeOrgPayment, verifyPayment
│   └── validations/
│       └── auth.ts                     # Zod schemas: loginSchema, adminLoginSchema,
│                                       #   changePasswordSchema, registerSchema
├── types/
│   ├── auth.ts                         # Interfaces: AuthUser, LoginRequest/Response,
│   │                                   #   AdminLoginRequest/Response, ChangePasswordRequest,
│   │                                   #   RegisterRequest/Response, IndividualUser, AdminUser
│   └── payment.ts                      # Interfaces: InitializePaymentResponse,
│                                       #   VerifyPaymentResponse, InitializeOrgPaymentRequest,
│                                       #   VerifyOrgPaymentResponse
└── tailwind.config.ts                  # Modified: font families use CSS vars
```

---

## 4. Auth flows

### Individual — Pay → Register → Login

1. User lands on `/` and clicks "Pay as an Individual."
2. `/pay/individual` renders a fixed ₦1,700 price card. On button click, the frontend calls `POST /payment/initialize/individual`. On success, the Paystack `reference` is written to `sessionStorage['payment_ref']` and the browser hard-navigates to the returned `payment_url`.
3. Paystack processes the payment and redirects back to `/pay/callback?reference=xxx`. The callback page reads the reference from the URL, reads `payment_type` from sessionStorage (defaults to `'individual'` if absent), and calls `GET /payment/verify?reference=xxx`. On success the response includes an `email` field confirming where the access code was sent.
4. The user navigates to `/register`, fills in username, password, confirm password, and the access code emailed by the backend. On submit, `POST /auth/register` is called. The returned token is POSTed to `/api/auth/set-cookie`, which sets the `definam_token` httpOnly cookie. The user is redirected to `/dashboard`.
5. On subsequent visits the user logs in at `/login` with username + password. Same token → cookie → `/dashboard` flow.

### Org Student — Access Code Entry (not built, F2 scope)

Org students never use the web payment or registration flow. Their school admin pays in bulk via `/pay/organisation`. The backend generates one unique access code per seat and emails a CSV to the admin. Students enter their code in the mobile app (SCR-03b). The frontend for this flow is out of scope for Week 1.

### Admin — Login → Force Password Change → Dashboard

1. Admin visits `/admin/login` and enters their school email and the temporary password emailed by the backend after org payment.
2. `POST /auth/admin/login` returns `{ token, user, force_password_change }`. The token is immediately POSTed to `/api/auth/set-cookie` regardless of the `force_password_change` flag — the cookie is always set first.
3. If `force_password_change` is `false`, the admin is redirected to `/admin/dashboard`.
4. If `force_password_change` is `true`, the login form is hidden and the change-password block appears (same page, no route change). A gold warning banner explains the situation.
5. On submit, `PATCH /auth/admin/change-password` is called with `credentials: 'include'` so the `definam_token` cookie is sent automatically. On success, the admin is redirected to `/admin/dashboard`.

---

## 5. API endpoints consumed

| Endpoint | Method | File | Purpose |
|----------|--------|------|---------|
| `/auth/login` | POST | `lib/api/auth.ts::loginUser` | Individual/admin login — returns token + user |
| `/auth/admin/login` | POST | `lib/api/auth.ts::adminLogin` | Admin login — returns token + `force_password_change` flag |
| `/auth/admin/change-password` | PATCH | `lib/api/auth.ts::changePassword` | Sets permanent password; reads token from cookie via `credentials: 'include'` |
| `/auth/register` | POST | `lib/api/auth.ts::registerUser` | Creates individual account; validates access code |
| `/payment/initialize/individual` | POST | `lib/api/payment.ts::initializeIndividualPayment` | Creates Paystack transaction; returns `payment_url` + `reference` |
| `/payment/initialize/organisation` | POST | `lib/api/payment.ts::initializeOrgPayment` | Creates Paystack transaction for bulk org seat purchase |
| `/payment/verify` | GET | `lib/api/payment.ts::verifyPayment` | Confirms Paystack webhook was received; returns email or org details |
| `/api/auth/set-cookie` | POST | `app/api/auth/set-cookie/route.ts` | Internal Next.js Route Handler — converts token to httpOnly cookie |

All external fetch calls go to `process.env.NEXT_PUBLIC_API_URL`. All non-2xx responses throw a typed `ApiError` (auth) or `PaymentError` (payment) with the HTTP status code attached, enabling precise error handling per status in the page components.

---

## 6. Cookie strategy

### How the cookie is set

No screen writes to `localStorage`, `sessionStorage`, or `document.cookie` for auth state. After every successful login or registration the frontend does two things in sequence:

```
Backend API  →  { token }  →  POST /api/auth/set-cookie  →  Set-Cookie: definam_token=...
```

`/api/auth/set-cookie` is a Next.js Route Handler (`app/api/auth/set-cookie/route.ts`) that runs on the server. It calls `response.cookies.set('definam_token', token, { httpOnly: true, ... })`, which causes Next.js to write the `Set-Cookie` response header. The browser stores the cookie but JavaScript cannot read it because `httpOnly: true`.

Cookie attributes:

| Attribute | Value | Reason |
|-----------|-------|--------|
| `httpOnly` | `true` | Blocks JavaScript access entirely; XSS cannot exfiltrate the token |
| `secure` | `true` in production, `false` in development | Enforces HTTPS in prod; relaxed locally for HTTP dev server |
| `sameSite` | `'lax'` | Sent on same-site navigations and top-level GET cross-site navigations; blocks cross-site POST CSRF |
| `path` | `'/'` | Cookie sent on all routes |
| `maxAge` | `604800` (7 days) | Session lasts one week; backend should also validate expiry |

### Why not localStorage

`localStorage` is readable by any JavaScript running on the page. A single XSS vector — an injected `<script>` tag, a compromised dependency, or a reflected-XSS payload — can silently exfiltrate the token. An `httpOnly` cookie physically cannot be read by JavaScript regardless of what code runs in the browser.

### How the backend reads it

The `definam_token` cookie is sent automatically by the browser on every same-origin request. The FastAPI backend reads it from the `Cookie` request header on protected routes, e.g.:

```python
from fastapi import Cookie

async def protected_route(definam_token: str = Cookie(default=None)):
    ...
```

The backend validates the token and returns 401 if it is absent, expired, or invalid.

---

## 7. Design tokens used

All five tokens are configured in `tailwind.config.ts` and referenced as Tailwind utility classes throughout every auth screen.

| Token | Hex | Applied on |
|-------|-----|------------|
| `ink` | `#0A0F1E` | Landing page background; heading text (`font-syne`) on all cream-bg screens; input text colour |
| `cream` | `#F5F0E8` | Page background for all auth screens except the landing page; app bar background |
| `jade` | `#1B6B4A` | Primary CTA buttons; logo container; active/focus field borders; floating field labels; links ("Forgot password?", "Pay as Individual"); icon accents; success states |
| `gold` | `#C8973A` | Warning banner in admin login force-password-change block (`AlertTriangle` icon and banner border/background) |
| `coral` | `#E85D3A` | Field-level validation error messages (11px, inline below input); error banners (`role="alert"`); field border on validation failure; payment verification error state |

Fonts are loaded via `next/font/google` in `app/layout.tsx` and exposed as CSS variables:

| Variable | Font | Tailwind class | Used on |
|----------|------|----------------|---------|
| `--font-syne` | Syne | `font-syne` | `<h1>` headings on every auth screen; landing page wordmark; price display on individual pay and org payment summary |
| `--font-dm-sans` | DM Sans | `font-dm-sans` | Body text, labels, buttons, sublabels — everything that is not a heading |

---

## 8. Environment variables required

Copy this block to `frontend/.env.local` for local development.

```dotenv
# Base URL of the FastAPI backend (no trailing slash)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Node environment — controls the `secure` flag on the auth cookie.
# Next.js sets this automatically; do not set it manually in .env.local.
# NODE_ENV=development
```

**Paystack callback URL** — this is an operational step, not an env var. You must register the following URL in the Paystack dashboard under **Settings → API Keys & Webhooks → Callback URL**:

- Development: `http://localhost:3000/pay/callback`
- Production: `https://definam.ng/pay/callback`

Paystack appends `?reference=xxx` to this URL after payment. The callback page reads the reference from the query string.

---

## 9. Known gaps and next steps

### Hard gaps — will break if not addressed before launch

| Gap | Location | Detail |
|-----|----------|--------|
| `/pay/individual` does not set `payment_type` in sessionStorage | `app/(auth)/pay/individual/page.tsx` | The callback page defaults to `'individual'` when `sessionStorage.getItem('payment_type')` is `null`, so it works today. If any future code sets a different `payment_type` without this page being updated, the wrong success state will render. Add `sessionStorage.setItem('payment_type', 'individual')` before the `window.location.href` redirect. |
| Paystack callback URL not registered | Paystack dashboard | The payment redirect will 404 until `http://localhost:3000/pay/callback` is registered. See section 8. |

### Soft gaps — scaffolded, no page built yet

| Gap | Location | Detail |
|-----|----------|--------|
| Forgot password flow | `app/(auth)/login/page.tsx` line 178 | Link `href="/forgot-password"` exists in the login screen but the route has no page. Clicking it will 404. |
| `/dashboard` redirect target | `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx` | Both pages call `router.push('/dashboard')` on success. The dashboard route does not exist yet. |
| `/admin/dashboard` redirect target | `app/(auth)/admin/login/page.tsx` | Both the normal login path and the post-password-change path call `router.push('/admin/dashboard')`. Route does not exist yet. |

### Out of scope (F2)

| Item | Notes |
|------|-------|
| Org student login (SCR-03b) | Access code entry screen for mobile. Not applicable to the web app. |
| Mobile splash screen (SCR-03c) | Mobile app screen. No web equivalent needed. |
| Session refresh / token rotation | Backend concern. The frontend sends the cookie; expiry handling is delegated to the backend 401 response. |
| Logout | No logout button or route built. A `DELETE /api/auth/set-cookie` Route Handler that clears the cookie is needed before any protected route ships. |
