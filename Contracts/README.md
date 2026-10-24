# API contracts

The backend's promise to this frontend: every endpoint the app may call, the
shape of every body, and the rules behind them. Agents treat these files as the
source of truth, so anything missing here will either be
guessed or left out. Both have happened.

## What every contract must contain

- **Every endpoint** the frontend may call: method, path, request body,
  response body, error statuses. An endpoint that is not in a contract does not
  exist for the frontend.
- **Every filter key of every list endpoint**, with its type and meaning, not
  just an example `filter` value. A list screen exposes exactly these filters.
  *(The products contract once showed only
  `{"schoolYearId":3}` as an example, so the screen shipped with a single filter
  although the backend supported many.)*
- **Sort fields** a list accepts.
- **Enums** (fixed ids such as product types) with their values and meaning.
- **Nullability** of every field, and what `null` means when it is not obvious.
- **Error body shapes** per status (`{ message }` vs `{ errors: { field } }`).

Business rules that are not shapes (what can be deleted, what a year means) go
in the matching `*Rules.md`.

## When a contract changes

Update the contract file first, then the dataProvider mapping and
`src/app/data-provider.test.ts` in the same change, then the screens. The
`drift-scan` skill compares the endpoints the code calls against these files.
