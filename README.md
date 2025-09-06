# Interactive Seating Map (Next.js + TS + Tailwind v4)

An accessible, high-performance seating map for events.
Features include keyboard + mouse selection, pan/zoom (desktop + touch), heat-map by price tier, “find available seats”, and persistent selections.

> Runs with **Next.js 14 (app dir)**, **TypeScript strict**, and **Tailwind v4**.
> Data is loaded from **`/public/venue.json`** and validated with **Zod**.

---

## 🚀 Quick start

```bash
# 1) Node 18+ and pnpm recommended
corepack enable
corepack prepare pnpm@latest --activate

# 2) Install
npm install

# 3) Dev
npm dev
# open http://localhost:3000

# 4) Production build (optional)
npm build
npm start
```

No env vars required. The venue data is read on the server with `fs` from `public/venue.json`.

---

## 🧪 Testing

The repo ships with a lightweight test harness:

```bash
# Unit / component tests (Vitest + RTL)
npm test

# End-to-end (Playwright)
npm test:e2e    
```

**What’s covered:**

* `SeatControls` adjacency finder logic (unit).
* `SeatMap` renders all seats and supports keyboard navigation basics (component).
* A happy-path E2E: load page → toggle heatmap → find adjacent → selection persists on reload.

---

## 📦 Packages & why they’re here

| Package                                                                            | Why                                                                |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **next**, **react**, **react-dom**                                                 | App platform + React 18 concurrent rendering                       |
| **typescript**                                                                     | Strict typing, safer refactors                                     |
| **zod**                                                                            | **Runtime** validation for `venue.json` (trust but verify)         |
| **zustand**                                                                        | Tiny global store for selection/UI (with localStorage persistence) |
| **tailwindcss (v4)**                                                               | Modern utility styling, mobile-first, fast                         |
| **clsx**                                                                           | Conditional class names for seat fills/states                      |
| **eslint**, **prettier**                                                           | Consistent, idiomatic code                                         |
| **vitest**, **@testing-library/react**, **@testing-library/user-event**, **jsdom** | Unit/component tests                                               |

> Node built-ins `fs`/`path` are used server-side to read `public/venue.json`. No client fetch required.

---

## 🗂️ Project structure (feature-first)

```
src/
  app/page.tsx                 # page layout
  components/
    SeatMap.tsx                # SVG map (event delegation, perf-optimized)
    SeatControls.tsx           # toolbar: heatmap, "find N adjacent"
    SeatSummary.tsx            # live selection subtotal
    Legend.tsx                 # status/heatmap legend
  hooks/
    usePanZoom.ts              # pinch/drag/wheel transforms (SVG)
    useSeatIndex.ts            # fast lookup & keyboard grid nav
    useSeatTooltip.ts          # hover/focus tooltip state
  lib/
    pricing.ts                 # price per tier + formatting
  store/
    selection.ts               # selected seats (persisted)
    ui.ts                      # heatmap toggle, etc.
  types/
    venue.ts                   # Zod schemas + TS types for venue data
public/
  venue.json                   # arena data (validated at runtime)
app/globals.css                # Tailwind v4 + custom utilities (btn, fills)
```

**Key design choice:** per-seat rendering is a tight loop (no per-seat components, no per-seat handlers). All interactions are delegated to the `<svg>` root for performance (smooth at \~15k seats).

---

## 🛠️ How it works (architecture & trade-offs)

### Rendering & performance

* **SVG + event delegation:** Only one set of handlers on the root `<svg>`. We avoid attaching listeners to thousands of nodes.
* **No subcomponents per seat:** Seats render as `<g>`+`<rect>`/`<text>` in a single map. This minimizes React overhead.
* **Memoized indexes:** `useSeatIndex` builds:

  * `byId` → seat data + (section,row)
  * `grid` → `"sec:row:col" → seatId"` for O(1) keyboard navigation
* **Pan/Zoom math in a hook:** `usePanZoom` centralizes pointer/wheel logic; applies a single transform on a `<g>` wrapper.

**Trade-offs:**

* SVG is simple and accessible; Canvas/WebGL could push beyond 50k seats but complicates a11y and hit-testing.
* A simple “center-biased” adjacency chooser is predictable and fast; a solver for complex gaps would be slower/more complex.

### Accessibility

* Seats are `role="option"` inside `role="listbox"` → SR-friendly.
* Keyboard: arrow keys move by grid; Enter/Space toggles selection.
* Focus outline via `.svg-focus`. Row labels anchored to the row’s **actual** `y` center (works with absolute seat coords).
* Tooltip content is decorative (hover); details also announced via `aria-label` and in the summary.

### State & persistence

* **Zustand** keeps selected IDs and UI toggles. Selection is persisted to **localStorage** so reloads keep your picks.
* Server loads `public/venue.json`, validates with **Zod**, and passes verified data to the client.

---

## 🎛️ Features

* Render all seats with absolute positions from `venue.json`
* Click **and** keyboard selection
* Up to **8 seats**; live subtotal (price by tier)
* **Persist selection** after reload
* **Heat-map toggle** (colors by price tier)
* **“Find N adjacent seats”** helper (1–8, prefers row center, respects availability & current selection)
* **Pinch-zoom + pan** (mobile + desktop wheel)
* Hover **tooltip** with price + status
* Desktop + mobile responsive layout
* Basic legend and polished toolbar

---

## 📄 Data format (`public/venue.json`)

```jsonc
{
  "venueId": "grid-8x17",
  "name": "Sample Arena",
  "map": { "width": 900, "height": 420 },
  "sections": [
    {
      "id": "M",
      "label": "Main",
      "transform": { "x": 60, "y": 50, "scale": 1 },
      "rows": [
        {
          "index": 1,
          "seats": [
            { "id": "M-1-01", "col": 1, "x": 0,  "y": 0,  "priceTier": 1, "status": "available" }
            // ...
          ]
        }
      ]
    }
  ]
}
```

* Seat `status`: `"available" | "reserved" | "sold" | "held"`.
* Prices are derived from `priceTier` via `lib/pricing.ts` (edit there).

---

## 🧩 Known gaps / TODOs

* **WebSocket live updates** (stretch goal): not implemented; would animate status changes and re-render fill classes.
* **Dark mode toggle**: the styles support it; a visible toggle could be added to the toolbar.
* **Viewport constraints**: pan/zoom currently allows panning past edges. Add clamping if desired.
* **Adjacency finder**: requires strictly consecutive `col` values. Could be enhanced to skip single gaps or prefer aisles.
* **Tooltips on keyboard focus**: currently hover only; easy to extend using the focused seat’s center coords.
* **Very large maps (>20k seats)**: still smooth, but text labels are hidden by default for perf; consider WebGL for extreme cases.
* **Unit test coverage**: core logic covered; add more a11y snapshots and pan/zoom tests as needed.

---

## 🧱 Blockers encountered & how they were solved

1. **“Failed to parse URL from /venue.json”**
   *Cause:* Fetching from `/venue.json` client-side with a basePath mismatch.
   *Fix:* Load `public/venue.json` **server-side** using `fs.readFile` and validate with Zod (`app/page.tsx`). No client fetch.

2. **Tailwind v4 migration**
   *Cause:* Old `@tailwind base/components/utilities` not applicable.
   *Fix:* Use v4 syntax: `@import "tailwindcss";` and `@theme` + custom utilities in `globals.css`. Seat color classes like `fill-seat-*` and `fill-tier-*` defined there.

3. **SVG row label alignment**
   *Cause:* Labels computed from grid index while seats used absolute `y`.
   *Fix:* Calculate label `y` from the **average seat.y** (fallback to grid) and `x` from the min seat.x. Anchored with `textAnchor="end"` and `dominantBaseline="central"`.

4. **Ref typing error**
   *Error:* `RefObject<SVGSVGElement | null>` not assignable to `RefObject<SVGSVGElement>`.
   *Fix:* Make the hook accept a **nullable** ref (`RefObject<SVGSVGElement | null>`) or omit the ref param and use `e.currentTarget`.

5. **Mobile pinch vs page scroll**
   *Cause:* Default touch scrolling conflicts with pinch/drag.
   *Fix:* Use pointer events on the `<svg>` and `touch-none` utility; gesture math handled in `usePanZoom` with clamped scales.

---

## 🎨 Styling notes (Tailwind v4)

* Global tokens + utilities live in `app/globals.css` using `@theme` and `@utility`.
* Seat fills use classes:

  * `fill-seat-available`, `fill-seat-reserved`, `fill-seat-sold`, `fill-seat-held`
  * `fill-tier-1`…`fill-tier-4`
* Button utilities: `.btn`, `.btn-primary`, `.badge`, `.toolbar`, `.grid-wrap`, `.input`, `.svg-focus`.

> To tweak colors, adjust CSS variables / utility classes in one place.

---

## ♿ Accessibility checklist

* `role="listbox"` around the map; each seat `role="option"` + `aria-selected`
* `aria-label` includes section, row, seat, status
* Focus outline on seats; Arrow keys navigate grid; Space/Enter toggle
* Heat-map switch uses `role="switch"` + `aria-checked`
* Live region (optional) can announce “no adjacent seats found” in controls

---

## 🔧 Useful scripts (from `package.json`)

```jsonc
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```
