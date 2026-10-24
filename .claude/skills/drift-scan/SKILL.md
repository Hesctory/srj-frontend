---
name: drift-scan
description: Periodic entropy scan of the SRJ frontend — finds where the code has drifted from CLAUDE.md, the skills, and the API contracts, and reports the debt still listed as LEGACY. Changes no code; writes a prioritized report to docs/drift/. Use weekly (it can be scheduled with /schedule or run with /drift-scan), before starting a large feature, or when the user asks "what is out of date", "clean up", "tech debt", "drift".
---

# Drift scan

Code drifts from its rules a little at a time, and every drifted file becomes an
example the next agent copies. This scan finds the drift before it spreads. It
**reports only** — it never fixes. The user picks what to fix.

## Checks

1. **Gates.** `npm run verify`. Anything red is the first item of the report.

2. **Legacy debt.** List every entry in the LEGACY lists of `eslint.config.mjs`
   and `src/test/architecture.test.ts`, with the rule it breaks. Note any entry
   whose file has since grown (`git log --oneline -- <file>` since the rule was
   added): debt that is still being built on is the most urgent.

3. **Instructions vs. code.** For `CLAUDE.md` and every `.claude/skills/*/SKILL.md`
   and `.claude/agents/*.md`:
   - every file path, component and hook they name still exists (`ls`, `grep`);
   - every command they name exists in `package.json`;
   - every rule they state still matches the code (spot-check with `grep`).
   A stale instruction is worse than none — report each one with its line.

4. **Code vs. contracts.** Collect the endpoint paths the code calls
   (`grep -rn "API_URL" src`, the resource names in `src/features/*/resources`,
   report maps in `src/app/data-provider.ts`) and compare them with the endpoint
   headings in `Contracts/*Contract.md`. Report endpoints the code calls that no
   contract defines, and contract endpoints/filter keys no screen uses.

5. **Duplication.** Look for near-copies that should be one shared piece: error
   mappers (`to*Error`), section headings, date/money formatting outside
   `src/utils/`, hand-rolled loading/error `useState` pairs where
   `useQuery`/`useMutation` would do.

6. **Dead code.** Exports nothing imports (grep each export name of recently
   changed files), components no route or resource renders.

7. **Oversized files.** Files within 20% of the `max-lines` budget (400 lines,
   comments excluded).

## Report

Write it to `docs/drift/<yyyy-mm-dd>.md` and summarise in chat:
a table of findings — severity, check, location, what drifted, suggested fix —
most severe first, then the legacy-debt table. Compare with the previous report
in `docs/drift/` if one exists: what got better, what got worse.
