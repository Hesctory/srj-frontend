# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SRJ System Frontend — a school management admin dashboard for managing students, enrollment, tuition payments, product sales, electronic billing (payment documents) and reporting. Built with React Admin as the primary framework.

## Commands

```bash
npm run dev          # Start development server (Vite)
npm run build        # Production build
npm run serve        # Preview production build
npm run type-check   # TypeScript type checking (app + vite config)
npm run lint         # ESLint with auto-fix
npm run lint:check   # ESLint, no fixing, zero warnings allowed
npm run format       # Prettier formatting
npm run test         # Vitest, once (test:watch to watch)
npm run verify       # type-check + lint:check + test + build — the definition of "passes"
```

## GIT

- Versioned with Git; the remote is a **public** GitHub repository (see **Public repository** below).
- Two clones share that remote: the user's, and the autonomous agent's (OS user `infernal_claude`, in its own home). They exchange work only through GitHub; neither can read the other's working tree.
- `main` is the only long-lived branch. Work on a branch `claude/<topic>` cut from `origin/main`; `main` changes only through pull requests the user approves, and the branch is deleted when its pull request is merged.
- Stage the paths you changed (`git add <paths>`), never `git add .` or `git add -A`: a stray screenshot or scratch file would be published.
- Commit messages follow Conventional Commits.
- When to commit: running as `infernal_claude`, finish each task by committing, pushing the branch and opening a pull request into `main` (`gh pr create`). In the user's own sessions, commit only when asked, and never push: the user does.
- Agent instructions (`CLAUDE.md`, `.claude/skills/`, `.claude/agents/`, `.claude/hooks/`, `.claude/settings.json`) are versioned with the code. When a change makes a rule here or in a skill outdated, update the rule in the same change. Only `.claude/settings.local.json` stays untracked.

## Public repository

Everything pushed is published, history included, and cannot be taken back.

- **Never commit a credential** of any kind (password, token, key) **or anyone's personal data**: names, DNIs, phones, e-mails, addresses, photos. The only exceptions are the maintainer's own name and e-mail, and the dev login in the `ui-check` skill: the backend's data generator creates it in every synthetic database, and it opens nothing real.
- **Test data and examples are synthetic**, in the ranges the backend's data generator uses, which no real person holds: DNIs `9xxxxxxx`, RUCs `2000000xxxx`, mobiles `900xxxxxx`, e-mails at `example.com`, passwords in tests starting with `test-`. A real-shaped value outside those ranges is a finding.
- **What the browser shows is never fixture material.** Never copy a row from a screenshot, snapshot or API response into code, a test, a contract or a commit message.
- **Local-only files**: `VITE_API_URL` lives in `.env.local`; saved screenshots go to `.ui-check/`. Both are gitignored.
- **The leak scan** is gitleaks with `.gitleaks.toml`. It runs on every file an agent edits (the lint hook), on every outgoing commit (`.githooks/pre-push`, installed once per clone with `install -m 755 .githooks/pre-push .git/hooks/pre-push`), and over the whole history in CI (`leak-scan`). When it reports something, rewrite the unpushed commit that added it before pushing. Findings are fixed, never silenced: never push with `--no-verify`, never add a `gitleaks:allow` comment or a `.gitleaksignore` file (neither is honoured, and the hook and CI refuse the file), and never loosen `.gitleaks.toml` to get a push through (CI judges a pull request by the base branch's rules).

## Project structure

The codebase is **feature-first**: each business module owns its resources,
routes, components, and hooks under `src/features/<module>/`. Cross-cutting
code lives in `src/shared/`, app shell/infra in `src/app/`. Imports use the
`@/` path alias (→ `src/`); see **Imports** below.

**Naming: files and folders are kebab-case** (`auth-provider.ts`,
`staff-members-list.tsx`). The only exception is `src/app/App.tsx`.

```
src/
├── app/                     # App shell & infra
│   ├── App.tsx              # React Admin root — renders appResources + AppCustomRoutes
│   ├── navigation.tsx       # Sidebar tree (see Navigation below)
│   ├── auth-provider.ts     # Auth: login/logout/checkAuth using localStorage
│   ├── data-provider.ts     # httpClient + API_URL (VITE_API_URL overrides it)
│   ├── store.ts             # RA store; preserves the theme preference across logout
│   ├── theme.ts
│   ├── layout/              # my-layout, my-menu, sub-menu, nav-menu-item, crud-toolbar
│   ├── i18n/                # Spanish messages
│   └── pages/               # home (dashboard), custom-login
├── features/                # One folder per business module (vertical slice)
│   ├── <feature>/
│   │   ├── resources/       # React Admin CRUD (List/Create/Edit + index → <X>Resource)
│   │   ├── routes/          # Non-CRUD custom pages for the feature
│   │   ├── components/      # Feature-owned UI
│   │   ├── hooks/           # Feature-owned hooks
│   │   ├── buttons/         # Feature-owned RA buttons
│   │   └── index.tsx        # Barrel: exports `resources` and `routes` arrays
│   ├── cashier/             # Caja — money at the counter; one sub-area per workflow (tuition/)
│   ├── billing/             # Comprobantes + voucher series
│   ├── students/            # Students, enrollments, student reports
│   ├── products/            # Catalog (versions, prices, kardex) + publishers
│   ├── staff/               # Staff members + work areas + job positions
│   ├── academic/            # School years, levels, grades, offerings, classrooms, costs
│   ├── settings/            # Institutions (RUC entities), accounting plan
│   └── index.tsx            # Aggregates every barrel into appResources + AppCustomRoutes
├── shared/                  # Used by 2+ features
│   ├── components/          # FormGrid, AcademicFilterSelector, LocationFormSelector, …
│   ├── hooks/               # useAcademicFilterData, academicCascade, …
│   └── buttons/             # BackToListButton
├── types/                   # Shared TypeScript interfaces (flat, no domain layers)
├── utils/                   # The only home for shared utilities (date, token, money, blob-file)
└── index.tsx                # Entry point (imports @/app/App)
```

**Key architectural decisions:**
- **Feature-first**: organize by business domain under `src/features/<feature>/`, not by technical role. A component used by exactly one feature lives in that feature; anything shared by 2+ features goes in `src/shared/`. A feature with several independent workflows splits them into sub-areas that follow the same layout (`cashier/tuition/`, later `cashier/sales/`).
- **Placement of future screens**: product sales and returns, the payments history and recovery cases go to `cashier/` (menu: Caja). Uniform sets go to `products/`. Purchases and provider payments go to a new `purchases/` feature (menu: Compras, after Productos). A screen without an API contract gets no feature folder, route or menu entry: never add placeholder pages.
- **React Admin** handles CRUD resources in each feature's `resources/`. Use proper `List`/`Edit` components; do not use `ListGuesser`/`EditGuesser`.
- **Registration**: every feature barrel exports `resources` (its `<Resource>`s) and `routes` (its custom `<Route>`s, i.e. non-CRUD pages in `routes/`). `src/features/index.tsx` lists the features once and builds `appResources` + `AppCustomRoutes`; `App.tsx` only renders those, plus bare lookup-only `<Resource name>`s.
- **Route hubs**: when a hub page links to sub-routes via cards, define a route manifest co-locating each `path` with its `element` and card copy (see `src/features/students/routes/reports/routes.tsx`), then drive both the hub buttons and the `<Route>` registrations from it — never hand-maintain a separate URL→component table. A card that links into a route owned by another feature omits `element`.
- **Imports**: relative imports only in the `./` form (same folder or below). Anything that would need `../` uses the `@/` alias instead. The only exception is importing assets from `public/`, which sits outside `src/` and the alias.
- **Auth state** is stored in `localStorage` (`token`, `user`). Role/permissions are read from `user.roles` — no separate `role` key.
- **Navigation** is driven by `src/app/navigation.tsx`, which `MyMenu` renders. Menu modules are ordered by frequency of use (counter work first, setup last), and do not have to match feature folders: setup lists edited a few times a year sit under Académico or Configuración even when another feature owns the code. A module with one screen renders as that screen. `src/test/navigation.test.tsx` fails when a menu entry opens nothing or a registered page is unreachable (a page nested under a menu path, like a hub card, counts as reachable).
- **Data layer** is flat: shared types in `src/types/`, utilities in `src/utils/` (do not create other shared `utils` folders). No Clean Architecture layers (UseCases/Repositories were removed).
- **Backend**: the API at `http://localhost:4000/api` (`API_URL` in `src/app/data-provider.ts`; `VITE_API_URL` in `.env.local` points elsewhere). There is no mock backend: screens are built and checked against the real API, running on a development database of synthetic data.
- **Data access: only `src/app/` talks HTTP.** Every backend call goes through the dataProvider in `src/app/data-provider.ts`. An endpoint that is not plain REST CRUD becomes a URL mapping or a custom method there, called from features with `useDataProvider()` inside `useQuery`/`useMutation` from `@tanstack/react-query`. Features never import `httpClient`/`API_URL`, never call `fetch`, and never create an `api/` folder. The two existing `api/` folders are legacy debt — do not copy them.
- **Permissions are not implemented yet.** `user.roles` is exposed through `authProvider.getPermissions`, but nothing enforces it: the menu has no permission fields. When a feature needs role checks, create the single source of truth in `src/app/permissions.ts` and read it from there — never inline role checks in components.

## React Admin conventions

- **Lists** use `DataTable` (`DataTable.Col`), never `Datagrid`. Every `<List>` with `filters` sets `debounce={500}`.
- **Create** always sets `mutationMode="pessimistic"`.
- **Toolbars**: every Create/Edit form uses `CRUDToolBar` (`src/app/layout/crud-toolbar.tsx`), which always renders the "Volver" button. `save` / `delete` are opt-in props; extra actions go as children. For changes that live outside the form (the product price grid), `saveAlwaysEnable` enables Guardar and `onBeforeLeave` lets Volver ask first. This button is a deliberate convention — keep it.
- **Form layout** uses `FormGrid` and its helpers (`FormSection`, `InlineFields`, `wideField`, `fullRowField`) from `src/shared/components/form-grid.tsx`. Never lay out fields with `<Box display="flex">` rows.
- Adding a new CRUD resource: follow the `ra-resource-creator` skill.

## Definition of done

1. `npm run verify` passes. Hooks enforce this: every edited file is linted, and the turn cannot end while type-check, lint or the related tests fail on changed files. CI runs the full `verify` on every push.
2. Every changed screen passes the `ui-check` skill at 320×720, 1280×720, 1366×768, 1920×1080 and 2560×1440 — no horizontal page scroll, no frame stretched past its content, no console errors.
3. The `frontend-reviewer` agent has reviewed the change (against the approved plan, when there is one) and its findings are fixed or reported to the user.

**Page states** every screen handles: loading; empty, distinguishing "nothing exists" from "no match for these filters"; error. Forms also handle: unsaved changes (warn on leave), submitting (button disabled), validation errors and server errors.

**Tests** (Vitest + Testing Library): mostly integration — render the real page with `renderWithAdmin` (`src/test/render-with-admin.tsx`) and a fake dataProvider, act like a user, assert on what the user sees and on the dataProvider calls. Unit-test dense pure logic (transforms, cascades, formatters). `src/app/data-provider.test.ts` pins every URL mapping — update it with the mapping when a contract changes. Never test React Admin itself or styling.

## How the rules are enforced

Rules that a machine can check are not only written here — they fail loudly, and every failure message says how to fix it:

- **ESLint** (`eslint.config.mjs`, section "Architecture rules"): no HTTP outside `src/app/`, no `Datagrid`, no guessers, no `../` imports, 400-line file budget.
- **Structural tests** (`src/test/architecture.test.ts`): no `api/` folders, kebab-case names, CRUDToolBar on every Create/Edit, pessimistic Create, debounced filtered Lists, FormGrid instead of flex rows in forms, `src/utils` as the only shared utils folder.
- **Hooks** (`.claude/settings.json` → `.claude/hooks/`): leak-scan and lint each edited file; block the end of a turn on a red type-check, lint or test.
- **Leak scan** (`.gitleaks.toml`, `.githooks/pre-push`, CI `leak-scan`): no secret and no real-shaped personal data in any commit (see **Public repository**).
- **LEGACY lists** in both files name violations that predate a rule. They are debt, not precedent: never copy those files' patterns, never add an entry without the user's approval, and delete an entry when its file is fixed.
- **Contracts** (`Contracts/`, see its README): the source of truth for endpoints and filters. If a contract lacks something the screen needs, ask — do not invent an endpoint.
- The `drift-scan` skill reports where code, contracts and these instructions have drifted apart.

## UI guidance precedence

When UI guidance conflicts, apply this order:

1. **`ui-patterns` skill** (`.claude/skills/ui-patterns`)
2. **Project React Admin conventions** — the rules in this file and in the `ra-resource-creator` skill
3. **React Admin defaults** — built-in behaviour (default titles, toolbars, empty pages, …)

## Core Principles

- Use flat `src/types/` and `src/utils/` structure — do NOT introduce UseCase/Repository/Domain layers.
- Use React Admin conventions for CRUD; do NOT force React Admin for non-CRUD pages.
- Organize new code by **feature/module**, not by technical role.
- Reuse existing components before creating new ones.
- Do not introduce new libraries without justification.
- Do not hallucinate APIs or system behavior.

## Conventions

- **UI language**: Spanish
- **Code language**: English (variables, functions, file names)
- **Commits**: Conventional Commits; when to commit and push is in **GIT** above.
- **Permissions**: Single source of truth for roles/permissions; never hardcode in components.

## Response Convention

End every response with: **Hu Tao loves you**
