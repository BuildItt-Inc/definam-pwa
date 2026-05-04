# DefinAm PWA

DevOps-first repository scaffold for the DefinAm College Mode PWA.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase
- Upstash Redis
- Railway
- Vercel

## Branch Strategy

- `main`: production
- `dev`: staging
- `feature/*`: feature branches

## Initial Routes

- `/login`
- `/activate`
- `/student`
- `/student/learn`
- `/student/recall`
- `/student/chat`
- `/student/progress`
- `/admin`
- `/admin/ids`
- `/admin/reports`

## Quick Start

1. Copy `.env.example` to `.env.local`.
2. Install dependencies with `npm install`.
3. Run `npm run dev`.

## Notes

- `.env.local` is intentionally ignored.
- `public/sw.js` is a placeholder. `next-pwa` will generate the service worker at build time.
- The provided app tree mirrors the planning document and is currently scaffold-only.
