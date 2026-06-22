---
name: mobile-first-design-practices
description: >-
  Guides agents through refactoring rigid desktop-first web components into fluid, accessible, and mobile-responsive layouts down to 320px.
---

# Mobile-First Design Practices

## Overview
This skill contains the guidelines, layout patterns, and checklist parameters to ensure the web application is fully responsive on mobile browser screens and PWAs down to 320px width (iPhone SE and newer) while remaining cohesive with the desktop layout.

## Dependencies
- `modern-web-guidance`: Consult when implementing modern CSS layout APIs (such as flexbox grids, aspect-ratios, container queries, and notch safe-areas).
- `a11y-debugging`: Consult to audit focus borders, contrast levels, and touch targets.

## Quick Start
To apply mobile-first responsiveness to a component or route:
1. Examine layout classes. Target any absolute pixel widths (`w-[420px]`, `width: 320px`) and absolute layout positionings.
2. Refactor hardcoded coordinates into relative fluid sizes: `w-full max-w-[420px]`.
3. Configure fluid viewport gutters: use `p-4 sm:p-gutter` (24px) for page-level padding.
4. Set touch action sizing: ensure buttons and inputs are at least `48px` tall (`py-2.5 px-4` or `h-12`).

## Workflow

### 1. Dimension Audit
- Scan layout structures for fixed width definitions (`width` attributes or Tailwind `w-[Npx]` style classes).
- Verify that outer layouts, dashboards, and auth cards are set to `w-full` with a suitable `max-w` constraint.
- Identify multi-column containers that do not wrap on smaller viewports.

### 2. Layout Fluidity Refactoring
- Replace rigid columns with wrapping container classes:
  - In Tailwind: use `flex flex-col sm:flex-row` or `grid grid-cols-1 sm:grid-cols-[columns]`.
  - Ensure margins (`my-*`, `mx-*`) and padding (`py-*`, `px-*`) are responsive. On small viewports (<360px), reduce horizontal margins and padding (e.g. use `p-4 sm:p-8`) to prevent squishing text inside cards.

### 2b. Info cards — do not pin long copy beside actions
**Avoid** this pattern for cards that mix a title, a multi-sentence description, and a badge or button:

```tsx
// BAD — description ends up in a squeezed column on md+
<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
  <div>
    <p className="font-medium">Title</p>
    <p className="max-w-xl text-sm">Long explanatory body copy…</p>
  </div>
  <div className="flex gap-2">
    <span>Badge</span>
  </div>
</div>
```

**Why it breaks:** On `md:flex-row`, flexbox allocates horizontal space between the text block and the badge/button column. The text wrapper defaults to `flex: 0 1 auto` and has no `min-w-0`, so it **shrinks** instead of growing. `max-w-xl` on the paragraph does not fix that — the parent column is already narrow. Copy wraps into a tall, skinny strip (seen on mentor payouts “Manual at launch”, and similar dashboard cards).

**Use instead — stacked card (default for status + explanation):**

```tsx
// GOOD — title/badge on one row, body full width
<div className="space-y-4 rounded-lg border p-5">
  <div className="flex flex-wrap items-start justify-between gap-3">
    <p className="min-w-0 text-sm font-medium">Title</p>
    <span className="shrink-0">Badge</span>
  </div>
  <p className="text-sm leading-relaxed">Full-width body copy…</p>
  {/* Optional: actions in their own row, not beside the paragraph */}
  <div className="flex flex-wrap gap-2 border-t pt-4">…</div>
</div>
```

**If actions must stay on the same row as text** (short label + single button only):

```tsx
<div className="flex items-start justify-between gap-4">
  <div className="min-w-0 flex-1">…short label or one line…</div>
  <div className="shrink-0">…button…</div>
</div>
```

Never put multi-sentence body copy in the left column of `justify-between` without `min-w-0 flex-1` on that column.

### 3. Touch Target and Form Optimization
- Touch targets on mobile must be easily tapable without accidentally clicking adjacent controls:
  - Minimum touch size: `48px` by `48px`.
  - Use `py-2.5` or `h-12` on buttons and select inputs.
- For inline actions (e.g. grid buttons), use `grid-cols-1 sm:grid-cols-3` or responsive wrapping, truncating long labels using `truncate` where necessary.

### 4. Interactive Layer and Notch Safety
- Ensure tooltips, menus, and absolute overlays use a high z-index (`z-50`) and correct offsets so they do not bleed off the viewport boundary on 320px screens.
- Implement PWA safe-areas when displaying sticky bottom navigation or full-bleed headers using CSS variables:
  ```css
  padding-bottom: env(safe-area-inset-bottom);
  padding-top: env(safe-area-inset-top);
  ```

## Common Mistakes
- **Implicit Grid Column Overflow**: Using `grid-cols-3` on mobile for dense text elements without testing SE dimensions, causing elements to warp or clip. Use wrapping layout helpers.
- **Card Padding Bleeding**: Hardcoding large margins on page layout containers (like `p-8` on 320px viewports), leaving only 256px of width for form fields. Always use responsive spacing: `p-4 sm:p-8`.
- **Absolute Positioning Tooltips**: Putting `top-full mt-4` tooltips inside container divs that have other text directly underneath, which blocks title elements. Offset the position using higher offsets or relative anchors.
- **Long copy beside badges (`justify-between` flex row)**: See §2b. Side-by-side title+paragraph vs. status badge/buttons creates a narrow text column and excessive vertical wrapping. Stack title+badge, then full-width body.
