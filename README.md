# SRJ System — Frontend

Admin dashboard for a school management system. It covers student enrollment, tuition payments, lunch/product sales, staff management, and reporting — all built with [React Admin](https://marmelab.com/react-admin/) on top of a REST API.

> **This is the frontend-only repository.** It will not work without its backend, which lives in a separate, private repository.

---

## Prerequisites

- [Node.js](https://nodejs.org/) 24 (the exact version is in `.nvmrc`)
- The **SRJ Backend** running and accessible (default: `http://localhost:4000/api`; set `VITE_API_URL` in `.env.local` to use another URL)

---

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Hesctory/SRJ-Frontend.git
npm ci
install -m 755 .githooks/pre-push .git/hooks/pre-push   # leak scan before every push
```

This repository is public. The pre-push hook runs [gitleaks](https://github.com/gitleaks/gitleaks) with `.gitleaks.toml` over every outgoing commit and refuses the push on a secret or a real-shaped personal identifier. Without gitleaks it refuses every push.

Install gitleaks **8.18.4**, the version CI pins (its default rules are copied into `.gitleaks.toml`): download `gitleaks_8.18.4_linux_x64.tar.gz` from the [release page](https://github.com/gitleaks/gitleaks/releases/tag/v8.18.4), check it against the release's checksums file, and put `gitleaks` on your `PATH`. On the SRJ development machine it is already installed at `/usr/local/libexec/srj/tools/gitleaks`, which the hooks find on their own.

---

## Running the app

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173` by default. It expects the backend API at `http://localhost:4000/api`.

### Production build

```bash
npm run build      # outputs to dist/
npm run serve      # preview the production build locally
```

---

## Other scripts

| Script | Description |
|---|---|
| `npm run type-check` | Run TypeScript type checking |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run format` | Format source files with Prettier |
| `npm run test` | Run the test suite once |
| `npm run verify` | Type-check, lint, test and build: what CI runs |

---

## Backend

The backend lives in a separate, private repository. Make sure it is running before starting the frontend: authentication, all data and business logic depend entirely on it.
