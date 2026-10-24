---
name: ui-patterns
description: >
  Patterns and antipatterns for designing and reviewing UI. Use this skill when designing a new interface, reviewing an existing one, deciding what to keep or remove from a page, or when the user says a UI "has too much", "feels noisy", "takes too much space", or asks to redesign, clean up, or improve any screen. Also apply proactively when building UI from scratch to avoid common design mistakes before they happen.
---

# UI Design Patterns & Antipatterns

The central question for every UI element is: **does its absence hurt the user?**

If the answer is "probably not", the default is removal. An element must earn its place — its presence adds cost (visual weight, reading time, decision load) even when it seems harmless.

---

## Start with the Environment

Before evaluating the page itself, audit what the surrounding environment already provides. A page sits inside a shell — a browser, an admin layout, a native app, a modal — and that shell already handles certain responsibilities.

Common things the environment provides:
- **Page context / title** — browser tab, AppBar, breadcrumb trail
- **Navigation** — browser back/forward, sidebar, tab bar
- **Layout structure** — consistent padding, max-width containers, spacing scale
- **Feedback** — toast/notification systems, loading states

Anything the page duplicates from this list is a candidate for immediate removal. Every admin dashboard title that echoes the sidebar item, every container that re-establishes spacing the layout already sets — these exist because the developer wasn't thinking about the shell. Remove them.

Exception: in this project the "Volver" button that `CRUDToolBar` renders on every Create/Edit form is a deliberate convention. Keep it; do not remove or question it.

---

## Antipatterns

### Redundant context
Showing information the environment already communicates. A page titled "User Management" inside an admin shell where the sidebar already shows "User Management" is pure redundancy. The user's eye skips it anyway — its only effect is pushing real content down.

### Instruction text for obvious tasks
"Select a person to assign a lunch" above a list of people. "Fill in the fields below to create a record." These exist to reassure developers that the UI makes sense, not to help users. If the interface requires text to explain what to do, the interface has a problem instructions can't solve. Remove the text, fix the interface.

### Double-labeled inputs
A `Typography` label above an input that already has its own `label` prop or `InputLabel` inside. One of them is enough — the input's own label is already positioned, animated, and accessible. The external Typography adds height and visual noise without adding information.

### Buttons the keyboard already handles
A "Clear" button next to a text field. A "Reset" button that empties a single input. The user already has Backspace, Delete, and Select-All. Dedicated buttons for these actions create visual weight for operations that cost the user zero effort without them. Only keep a clear/reset action when clearing is destructive, irreversible, or affects multiple fields at once.

### Conditional sections that cause layout shifts
A panel, section, or group that appears only when a condition is met (e.g., "payment options appear after selecting items"). The sudden appearance shifts everything below it, disorienting the user. Prefer rendering all sections always, with non-applicable ones disabled or visually muted. The layout stays stable; only the interactive state changes.

### A pane reserved for nothing
A list–detail screen that keeps the detail pane open while nothing is selected: the list is squeezed into a sidebar next to a big empty box saying "choose something". Until a record is open, the list *is* the page — give it the room (more columns, centred). Only opening a record shrinks the list into a side pane beside the detail.

### Frames wider than their content
A card, pane or paper that stretches to the full screen while what it holds stops at 1,300px, leaving a blank band *inside* the frame on a wide monitor. Size the frame to its content (a max width derived from what it shows) and centre it; the spare width becomes margin outside the frame, which reads as intentional.

### Drawers for primary navigation
Hiding the main list in a drawer on narrow screens. A drawer is for occasional secondary things; the list the user works from deserves its own page, with Volver on the detail to get back.

### Order that moves under the user's hand
A list whose items reorder when the user expands, edits or reveals one — opening an old version and seeing it jump above the current one. Decide the order from stable data (newest first, current before old) and keep it no matter what is expanded or typed.

### A reference taken for a look
"Like Excel", "like WhatsApp": a reference to another tool usually names how something *works* (type in cells, drag to fill, paste rows), not how it *looks*. Copy the interaction, not the gridlines and hatching. If unsure which one is meant, ask before building. And keep affordances discoverable: a drag handle that appears only after a click is one the user never finds — show it on hover.

### Hardcoded element heights for dynamic content
Setting a fixed pixel height on a list, table, or content area when the content's natural size is unknown or variable. This either truncates content unexpectedly or leaves vast empty space. Use viewport-relative sizing or flex-fill instead (see Patterns section).

---

## Patterns

### Contextual defaulting
When a value can be derived from context, pre-select it. Don't make the user state the obvious.

- A date field in a daily-use operational tool almost always means today → default to today.
- A dropdown whose correct value can be inferred from the time of day, the user's role, or a previous selection → infer it and pre-select; allow override.
- A filter that has a dominant common-case value → start with it selected.

Each eliminated decision reduces cognitive load. Over hundreds of daily uses, this matters.

### Precision labels for high-stakes fields
The principle of removing labels has an exception: fields where a mistake has real consequences. Money amounts, legal dates, irreversible actions — keep their labels explicit and clear. The goal is reducing noise, not removing safety cues. When a user enters the wrong amount because the field didn't clearly say "amount due" vs "amount paid", the label was worth its space.

### Viewport-fill for scrollable content

**When to apply:** a page contains a list, table, or feed as its primary content alongside a fixed control area (filters, actions, summary). The goal is to avoid the page itself scrolling — instead, only the content list scrolls.

**How it works:** constrain the outer container to the available viewport height (total viewport minus any fixed chrome like a top bar), then use a flex column chain where each level passes height down to the next, until the list container receives a defined height and can overflow-scroll internally.

The non-obvious requirement: every flex container in the chain needs `min-height: 0` (or equivalent). Without it, flex children default to `min-height: auto`, which means they refuse to shrink below their content size — the overflow never triggers.

**When not to apply:** document-style pages (articles, forms that benefit from continuous scrolling), pages where content is naturally short, or contexts where the page scroll is intentional (e.g., a dashboard with multiple sections).

### Primary workspace / secondary controls separation
Most operational interfaces have two kinds of content: the thing you're working on (a list, a record, a canvas) and the controls for that work (filters, date, save, submit). These have different spatial needs.

The workspace needs room — it's where the user's attention lives. The controls need to stay accessible without dominating. Placing them side by side (rather than stacking controls above the workspace) keeps both in view simultaneously, which is appropriate for PC-first daily-use tools. This is not a prescriptive two-column rule — it's a question of which content is primary and giving it proportional space.

---

## Context Considerations

Patterns are context-dependent. Before applying them, establish:

**Platform:** PC-first interfaces tolerate and benefit from density; the browser always provides navigation. Mobile-first interfaces need larger touch targets, simpler layouts, and explicit navigation.

**Use frequency:** A page used 50 times a day by the same operator needs maximum efficiency — remove anything that slows the repeated action. A page used once a month by different users needs more explanation and affordance — some instruction text is warranted.

**Stakes:** Low-stakes actions (search, browse, filter) can afford aggressive noise reduction. High-stakes actions (submit payment, delete record, send communication) warrant extra labels, confirmation steps, and clear affordances even if they add friction.

**What the user already knows:** An operator who has run the same workflow for months doesn't need instructions. A first-time user does. Where possible, design for the expert path and let the interface teach through use rather than through upfront instruction.
