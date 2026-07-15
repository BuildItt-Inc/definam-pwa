---
name: executive-monochrome-design
description: Standard UI/UX design system for premium, motion-rich, executive monochrome web applications. Includes exact typography, icons, and layout rules.
---

# Executive Monochrome Design System

You are designing a premium, high-end web application. Your design must adhere strictly to the "Executive Monochrome" philosophy. The UI should feel sophisticated, fast, and grounded, avoiding overly playful or "startup-glow" aesthetics.

## 1. Typography & Fonts
- **Primary Font**: `Inter` (Google Fonts). Set as `--font-inter` and applied via Tailwind's `font-sans`.
- **Monospace Font**: `DM Mono` (Google Fonts). Set as `--font-dm-mono` and applied via `font-mono`.
- **Headers**: Must be heavy (`font-black` or `font-extrabold`) with tight letter spacing (`tracking-tight` or `tracking-tighter`). Never use thin headers.
- **Micro-copy/Metadata**: Use `text-[10px] uppercase font-bold text-muted tracking-wider` for section labels, tags, or tiny helper text.
- **Prose/Reading**: Use `leading-relaxed` or `leading-loose` for large blocks of text to improve readability.

## 2. Iconography
- **Library**: Strictly use `lucide-react`.
- **Sizing**: Default to `w-5 h-5` for standard icons, `w-4 h-4` for inline/button icons, and `w-3 h-3` for micro-indicators (like checks/crosses inside tiny badges).
- **Styling**: Icons should inherit the text color by default. Use `text-muted` for decorative/secondary icons, and `text-ink` for active/primary ones.

## 3. Color Philosophy (Strictly Semantic)
- **The Core is Monochrome**: Rely entirely on a grayscale palette for structure. 
  - `text-ink` for primary text.
  - `text-muted` for secondary text.
  - `bg-bg-0` for the absolute deepest background (the page body).
  - `bg-bg-1` and `bg-bg-2` for elevated sections.
  - `bg-card` for distinct floating surfaces.
- **No Decorative Accents**: Do NOT use brand colors for background floods, glowing shadows, or passive icons.
- **Semantic Colors Only**: Color must communicate status, not branding.
  - **Green** (`text-green-600`, `bg-green-100`): Correct answers, success states, mastered items.
  - **Red** (`text-red-600`, `bg-red-100`): Incorrect answers, destructive actions.
  - **Amber** (`text-amber-700`, `bg-amber-50`): Intermediate states, warnings.

## 4. Structural Aesthetics (Tailwind)
- **Deep Rounding**: Use substantial border radii for structural elements. 
  - Buttons: `rounded-xl` or `rounded-full`.
  - Cards/Containers: `rounded-2xl` or `rounded-[24px]`.
  - Major Modals: `rounded-[32px]`.
- **Subtle Borders & Elevation**: Avoid harsh lines. Separate sections using subtle background color differences (`bg-card` vs `bg-bg-0`) or ultra-light borders (`border border-border` or `border border-border-2`).
- **Shadows**: Use `shadow-xs` or `shadow-sm` for resting cards, `shadow-xl` for dropdowns, and `shadow-2xl` for large modals.

## 5. The Motion System (Framer Motion)
Never use random transition values. Always import and use centralized motion tokens from `lib/motion.ts`.
- **The Standard Easing**: Use `ease: [0.4, 0, 0.2, 1]` for almost all transitions.
- **Tappable Surfaces (`scaleTap`)**: Every interactive card (dashboard tiles, feature grids, buttons) must shrink slightly on press using Framer Motion: `{ whileTap: { scale: 0.97 }, transition: { duration: 0.15 } }`. Do not rely on CSS `:active`.
- **Modals (`modalSheet`)**: Modals must slide up from the bottom (`initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }}`).
- **Staggered Reveals**: When rendering lists or AI feedback, stagger the entrance of children by `0.06s` to guide the user's eye naturally down the page.

## 6. Trust & Transparency (UX Patterns)
- **Grounded AI**: If the app features AI, the AI must explicitly cite its sources. Always render source chips (e.g., `📄 Sourced from: [filename]`) beneath AI text.
- **Staged Loading**: Avoid endless spinners. For tasks taking >2 seconds, use cycling text that explains what the system is doing ("Reading documents...", "Extracting key concepts...").
- **Explicit Deltas**: When showing a user's progress or score, show the *change*, not just the final number (e.g., "Readiness: 34% → 45%").

## 7. The "Warm Ivory" Palette Configuration
This is the exact CSS variable configuration to use in `globals.css` (or `:root` scope) to get the exact premium backgrounds, text colors, and borders:

```css
/* ── The "Warm Ivory" Monochrome Palette ────────────────────── */
:root {
  /* Backgrounds: Warm, paper-like ivory instead of cold grays */
  --bg-0:   #FAF8F5; /* Deepest background (app body) */
  --bg-1:   #FFFFFF; /* Elevated surfaces (cards, modals) */
  --bg-2:   #F2EFEA; /* Hover states, secondary buttons */
  --bg-3:   #E7E2DA; /* Deepest structural gray */

  /* Cards */
  --card:   #FFFFFF; /* Pure white for high-contrast floating elements */
  --card-2: #FAF8F5; /* Blends into bg-0 for flat cards */

  /* Borders: Ultra-subtle, slightly warm transparency */
  --border:   rgba(45, 38, 30, 0.08); /* 8% opacity dark brown/ink */
  --border-2: rgba(45, 38, 30, 0.14); /* 14% opacity for active borders */

  /* Typography: Ink instead of pure #000000 */
  --ink:   #181715; /* Primary text, headings */
  --ink-2: #282623; /* High-emphasis secondary text */
  --muted: #6A665E; /* Standard secondary text (timestamps, labels) */
  --faint: #9E988E; /* Placeholder text, disabled states */

  /* Semantic UI Colors (Strictly for status) */
  --success:    #16A34A; /* Tailwind green-600 */
  --success-bg: rgba(22, 163, 74, 0.08);
  
  --warn:       #D97706; /* Tailwind amber-600 */
  --warn-bg:    rgba(217, 119, 6, 0.08);
  
  --danger:     #DC2626; /* Tailwind red-600 */
  --danger-bg:  rgba(220, 38, 38, 0.08);

  /* Border Radii Tokens */
  --radius-sm: 6px;
  --radius:    10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
  --radius-full: 9999px;
}
```

### Tailwind config mapping:
```typescript
colors: {
  "bg-0":        "var(--bg-0)",
  "bg-1":        "var(--bg-1)",
  "bg-2":        "var(--bg-2)",
  "bg-3":        "var(--bg-3)",
  card:          "var(--card)",
  "card-2":      "var(--card-2)",
  border:        "var(--border)",
  "border-2":    "var(--border-2)",
  ink:           "var(--ink)",
  "ink-2":       "var(--ink-2)",
  muted:         "var(--muted)",
  faint:         "var(--faint)",
  success:       "var(--success)",
  "success-bg":  "var(--success-bg)",
  warn:          "var(--warn)",
  "warn-bg":     "var(--warn-bg)",
  danger:        "var(--danger)",
  "danger-bg":   "var(--danger-bg)",
}
```

### The Golden Rule for Backgrounds:
1. The `<body>` or `<main>` wrapper always gets `bg-bg-0`.
2. Any floating card, modal, or major content container gets `bg-card` (which is `#FFFFFF`).
3. Because the body is `#FAF8F5` and the cards are `#FFFFFF`, you get a beautiful, subtle contrast without needing heavy drop shadows. We only use a faint `border border-border` around cards to give them crisp edges!
