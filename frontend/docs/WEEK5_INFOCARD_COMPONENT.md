# Week 5 — Extract InfoCard Component

## What was built

A shared `InfoCard` component was extracted from repeated inline markup
across the auth screens. Previously each screen hand-rolled its own
jade-tint card with duplicated Tailwind classes and inconsistent spacing.

## Files changed

| File | Change |
|------|--------|
| `tailwind.config.ts` | Added `jade-tint-border: #9FE1CB` design token |
| `components/ui/InfoCard.tsx` | New component (created) |
| `app/(auth)/mobile/code/page.tsx` | Instance 1 migrated |
| `app/(auth)/pay/individual/page.tsx` | Instance 4 migrated |
| `app/(auth)/pay/organisation/page.tsx` | Instance 5 migrated |
| `app/(auth)/register/page.tsx` | Instance 6 migrated |
| `app/(auth)/admin/login/page.tsx` | Warning card migrated |
| `app/(auth)/pay/callback/page.tsx` | Instances 2 & 3 wrapped (children mode) |

## Component API

```tsx
<InfoCard
  tone?="jade | gold"          // default jade
  icon?={LucideIcon}
  iconStyle?="pill | bare"     // default pill
  title?="string"
  body?="string"
  children?                    // alternative to title/body — shell-only mode
  className?="string"          // one-off margin/padding overrides
/>
```

**Structured mode** (icon + title + body): renders `flex items-start gap-3 p-4` layout.
Jade pill: `w-9 h-9 bg-jade rounded-xl` icon container with white icon at size 17.
Bare (jade or gold): icon at size 20, `text-jade` or `text-gold`.
Gold tone never renders a pill — falls back to bare automatically.

**Shell-only mode** (children prop present): renders just `rounded-xl border`
background/border shell with no forced layout. Padding and width must be
passed via `className`. Used for the two callback cards which have their
own internal structure.

## Consistency changes

- Instance 6 (register page) standardised from `items-center / py-3.5`
  to the same `items-start / p-4` layout as the other cards — this was
  drift, not intentional.
- Inline hardcoded `border-[#9FE1CB]` replaced by the new
  `border-jade-tint-border` token across all migrated sites.

## Left out of scope (per task spec)

- `app/(auth)/pay/organisation/page.tsx` lines 241–255 (price summary widget)
- `app/(admin)/admin/ids/page.tsx` lines 117–131 (subscription banner with
  `borderLeft` override)
