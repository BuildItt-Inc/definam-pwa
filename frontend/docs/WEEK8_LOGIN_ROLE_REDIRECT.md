# WEEK8 — Fix post-login role-based redirect

## What was fixed

`/login` always redirected to `/student` after a successful login, regardless of the account role. The `loginUser` API call already returned a `role` field in its response (`LoginResponse.role`) but the return value was being discarded.

## Files changed

| File | Change |
|------|--------|
| `app/(auth)/login/page.tsx` | Capture `{ role }` from `loginUser` return value; redirect to `/admin` when `role === 'admin'`, otherwise `/student` |

## Diff (net change: 2 lines)

```diff
-      await loginUser(values);
-      router.push('/student');
+      const { role } = await loginUser(values);
+      router.push(role === 'admin' ? '/admin/login' : '/student');
```

## Role values confirmed

From `types/auth.ts` — `LoginResponse.role: string` carries:

- `"admin"` → redirect to `/admin/login` (not `/admin` directly — so the existing `force_password_change` inline flow on that page runs before granting dashboard access)
- `"student_individual"` → redirect to `/student`
- `"student_org"` → redirect to `/student`

## Gaps / follow-ups

- `role` is typed as `string`, not a union literal. If the backend ever returns an unexpected role value, the user lands on `/student` (safe default).
- `/admin/login` was intentionally left untouched — it already hard-codes `/admin` and is correct.
