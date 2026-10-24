---
name: ui-check
description: Check SRJ frontend pages in a real browser at every target resolution (phone to QHD) — horizontal overflow, blank space inside frames, console errors, loading/empty/error states — using the Chrome DevTools MCP. Use after building or changing any screen, when the user reports a layout or responsiveness problem, or when the frontend-reviewer agent verifies a change. Invoke for "check responsiveness", "does it look right", "test the page", "ui check".
---

# UI check — responsiveness and page states in a real browser

Type-checks and unit tests cannot see layout. This check measures it: the page
is loaded at each target resolution and a script reports anything wider than
the content area, so "it overflows at 1366" becomes a number and an element,
not an impression.

## Target Resolutions

There's no target resolution. 
Even if I work on an HD screen, I can still make the browser smaller, making it use half the available size.
The ideal scenario, is that responsivity doesn't break at any resolution.

## Setup

1. The app must be running, and it must be *your* clone's dev server. Two
   clones run dev servers on this machine, one port each:
   - the user (`hutaolover`): 5173, `npm run dev`
   - the autonomous agent (`infernal_claude`, check with `whoami`): 5180,
     `npm run dev -- --port 5180 --host 127.0.0.1`

   Check with `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:<port>`.
   If it is not up, start it in the background and wait for 200. `strictPort`
   is set in `vite.config.ts`, so a busy port fails instead of moving to the
   next one. If yours is taken, say so and stop: never measure the other
   clone's server.
2. The backend must be up: `curl -s -o /dev/null -w "%{http_code}\n" <API>`,
   where `<API>` is `VITE_API_URL` from `.env.local`, or
   `http://localhost:4000/api` when that is not set. If it is down, say so and
   stop. For `infernal_claude` it is its own backend instance, on synthetic
   data, and never the application that runs on the school's real database.
3. Open the page with `navigate_page`. If it lands on `/login`, log in as the
   admin that the backend's dev data generator creates in every synthetic
   database:

   ```
   email:    admin@srj.local
   password: Admin123!
   ```

   It exists only in generated databases and opens no real system, which is
   why it can be written in this public repository. If it is rejected, the
   backend is not running on a generated database: say so and stop. Never try
   other credentials.
4. The browser shows development data. A screenshot you save goes under
   `.ui-check/` (gitignored), and nothing it shows is copied into code, tests,
   contracts or commit messages.

## For each page × each viewport

1. Set the viewport with `emulate` (`viewport: "1366x768x1"`), then reload the
   page (some layouts measure once at mount). Use `emulate`, not `resize_page`:
   resizing fails while the browser window is maximized, emulation does not.
   Confirm with `() => innerWidth + "x" + innerHeight`. When done, call
   `emulate` with no arguments to restore the real window size.
2. Wait until the data has loaded (`wait_for` a row, a field, or an empty-state
   text).
3. Run this with `evaluate_script`. The app scrolls inside `<main id="main-content">`,
   not the document, so both are measured:

   ```js
   () => {
     const main = document.getElementById("main-content");
     const vw = window.innerWidth;
     const bound = main ? main.getBoundingClientRect().right : vw;
     const name = (el) =>
       el.tagName.toLowerCase() +
       (el.id ? "#" + el.id : "") +
       (typeof el.className === "string" && el.className.trim()
         ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
         : "");
     const sticksOut = (el) => {
       const r = el.getBoundingClientRect();
       return r.width > 0 && r.right > bound + 1;
     };
     const culprits = [...(main ?? document.body).querySelectorAll("*")]
       .filter((el) => sticksOut(el) && !(el.parentElement && sticksOut(el.parentElement)))
       .slice(0, 10)
       .map((el) => ({
         element: name(el),
         overflowPx: Math.round(el.getBoundingClientRect().right - bound),
         text: (el.textContent || "").trim().slice(0, 40),
       }));
     const innerScrollers = [...document.querySelectorAll("*")]
       .filter((el) => el !== main && el.scrollWidth > el.clientWidth + 1 &&
         ["auto", "scroll"].includes(getComputedStyle(el).overflowX))
       .slice(0, 10)
       .map(name);
     return {
       viewport: `${vw}x${window.innerHeight}`,
       pageOverflowPx: Math.max(
         document.documentElement.scrollWidth - vw,
         main ? main.scrollWidth - main.clientWidth : 0,
       ),
       culprits,
       innerScrollers,
     };
   }
   ```

4. At 1920 and 2560, also measure blank space *inside* frames (panes, cards,
   papers): how far each frame reaches past its rightmost text. A frame that
   is much wider than what it holds should shrink and the content be centred,
   leaving the margin outside the frame:

   ```js
   () => {
     const frames = [...document.querySelectorAll(
       "#main-content section, #main-content .MuiPaper-root, #main-content .MuiCard-root",
     )].filter((el) => el.getBoundingClientRect().width > 600);
     const textRight = (el) => {
       let right = -Infinity;
       const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
       while (walker.nextNode()) {
         if (!walker.currentNode.textContent.trim()) continue;
         const range = document.createRange();
         range.selectNodeContents(walker.currentNode);
         for (const r of range.getClientRects()) right = Math.max(right, r.right);
       }
       return right;
     };
     return frames.map((el) => {
       const r = el.getBoundingClientRect();
       const slack = Math.round(r.right - textRight(el));
       return {
         frame: el.tagName.toLowerCase() + (el.getAttribute("aria-label") ? `[${el.getAttribute("aria-label")}]` : ""),
         width: Math.round(r.width),
         emptyRightPx: slack,
         emptyPct: Math.round((100 * slack) / r.width),
       };
     }).filter((f) => f.emptyPct > 25);
   }
   ```

   Then measure whether the content is really centred: the margins left and
   right of the page's frames, taken together, inside `main`. Check it on
   records whose content is narrow as well as wide (a product with one price
   and one with sixteen sizes): centring a fixed-width track instead of the
   real content looks centred only on the widest record.

   ```js
   () => {
     const main = document.getElementById("main-content").getBoundingClientRect();
     const frames = [...document.querySelectorAll(
       "#main-content section, #main-content > * > .MuiPaper-root, #main-content .MuiCard-root",
     )].map((el) => el.getBoundingClientRect()).filter((r) => r.width > 200);
     const left = Math.min(...frames.map((r) => r.left));
     const right = Math.max(...frames.map((r) => r.right));
     return {
       leftMarginPx: Math.round(left - main.left),
       rightMarginPx: Math.round(main.right - right),
     };
   }
   ```

5. `list_console_messages` — any error or React warning is a finding.
6. `take_screenshot` only when something fails or looks wrong, as evidence —
   and always once at 320 and once at 2560: those are the viewports a script
   judges worst.

## Verdict per page × viewport

- **Fail**: `pageOverflowPx > 0`, any `culprits`, or a console error.
- **Warn**: an `innerScrollers` entry (a table or panel with its own horizontal
  scrollbar). Acceptable only for wide data tables at 1280, never for forms.
- **Fail**: at 1920 or 2560, a frame from step 4 (more than 25 % of its width
  empty past its content). Fix by capping the frame at its content's width and
  centring it, not by stretching the content to fill it.
- **Fail**: at 1920 or 2560, content that does not fill `main` whose left and
  right margins differ by more than 32 px (step 4, centring script) on any
  record, narrow or wide.
- **Fail**: at 320, a control cut off, or a scroll area so short that the main
  content shows only a few rows (fixed headers and footers eating the height).
- **Warn**: at 2560, form fields or text lines stretched across the full width.

## Page states

Where the page has them, check that each state renders something deliberate:
loading (spinner or skeleton, no layout jump), empty (distinguish "nothing
exists" from "no match for these filters"), error (backend down or 4xx shows a
message, not a blank page), and for forms: unsaved changes warn on leave, the
submit button is disabled while saving.

## Report

A table: page | viewport | verdict | overflow px | culprit elements | console
errors. Then the concrete fix for each failure (usually: replace a `display="flex"`
row with `FormGrid`, give a table container `overflowX: "auto"`, or remove a
fixed `width`).
