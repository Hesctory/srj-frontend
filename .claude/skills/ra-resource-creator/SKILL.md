---
name: ra-resource-creator
description: Use when adding a new React Admin CRUD resource to the SRJ frontend. Given an API format document or field spec, generates TypeScript types, List component, Create form, Edit form, and feature-barrel registration — all following the project's established patterns. Invoke whenever the user says "create resource", "new module", "add CRUD for X", shares an API format file, or asks to implement a new entity. Use this skill proactively any time a new backend entity needs a frontend representation.
---

# RA Resource Creator — SRJ Frontend

This skill produces a complete, correctly wired React Admin CRUD resource from an API spec. The most common mistakes (wrong `reference=` names, missing `optionText`, duplicating existing components) are prevented by a mandatory research phase before any code is written.

**Nothing in this skill is a catalog.** Reference names, `optionText` values and reusable components are always read from the code at run time (Phase 2), so this file cannot drift from the codebase. If an instruction here ever disagrees with the code or with `CLAUDE.md`, `CLAUDE.md` wins — report the mismatch.

## Workflow

Work through these 7 phases in order. Do not skip the research phase.

### Phase 1 — Parse the spec

Read the API format document carefully. Extract:
- Required vs optional fields (required fields need `isRequired validate={required()}`)
- All foreign key fields (will need `ReferenceInput + SelectInput`)
- Nested object fields (will become dot-notation sources in the form)
- The list response shape (what the GET endpoint returns per item)
- Filter query params (become filter inputs in the List). Expose **every** filter key the contract lists for the list endpoint. If the contract does not list its filter keys, stop and ask the user for them — do not ship a list with only the filters you happened to notice.

### Phase 2 — Research (mandatory before writing any code)

1. **Reference names** — list every `reference=` the app already uses:

   ```bash
   grep -rhoE 'reference="[^"]+"' src | sort | uniq -c | sort -rn
   grep -n '<Resource name=' src/app/App.tsx
   ```

   Use the exact spelling found. A foreign key whose resource appears in neither list is new: take the name from the API spec and say so in your report. Never guess a spelling.

2. **`optionText`** — for every reference you will use, check how existing code displays it:

   ```bash
   grep -rn -A4 'reference="<name>"' src | grep optionText
   ```

   Many lookups display a field other than `name`, and the code is not always consistent (the `-A4` window can also catch a neighbouring input). Open the matching files and read the actual `SelectInput`. If usages disagree, or none exist and the spec doesn't name the display field, check the lookup's API response or ask — never assume `name`.

3. **Reusable components** — before writing any selector, cascade or field group, look at what exists:

   ```bash
   ls src/shared/components src/features/*/components
   grep -rln "sourcePrefix" src
   ```

   Shared ones live in `src/shared/components/` (e.g. `location-form-selector.tsx`, `form-grid.tsx`, `academic-filter-selector.tsx`). A component inside another feature's `components/` is owned by that feature. Reuse what exists; never reimplement it.

4. **A reference example** — read one complete resource before writing yours, e.g. `src/features/academic/resources/levels/` (simple) or `src/features/staff/resources/staff-members/` (tabbed).

### Phase 3 — Generate types

Create `src/types/<entity-name>.ts` (**kebab-case**, singular — e.g. `staff-member.ts`). Include:
- A **CreateDTO** interface matching the POST body (required/optional correctly typed)
- A **ListDTO** interface matching what the GET list returns per item
- Any nested DTOs (e.g. a contract or location sub-object)

Follow the style of `src/types/staff-member.ts` and `src/types/employment-contract.ts`.

### Phase 4 — Generate List

File: `src/features/<module>/resources/<entities>/<entities>-list.tsx`

- Use **`DataTable`** with `DataTable.Col` columns (never `Datagrid`). See `levels-list.tsx` / `costs-list.tsx`.
- Columns come from the ListDTO fields. Wrap custom/reference fields as children of `DataTable.Col`.
- Filters: one input per filterable field from the spec, `alwaysOn` for the primary ones.
- **Every `<List>` that has `filters` gets `debounce={500}`.**

### Phase 5 — Generate Create

File: `src/features/<module>/resources/<entities>/<entities>-create.tsx`

Form type by complexity:
- **`SimpleForm`** — simple, flat resources
- **`TabbedForm`** — many fields or logical groupings (tabs follow the entity's own semantics; no fixed template)

Always:
- `<Create redirect="list" mutationMode="pessimistic">` — **`mutationMode="pessimistic"` is mandatory**.
- Toolbar: `toolbar={<CRUDToolBar save />}` — gives the "Volver" button plus Save. **Every Create/Edit form uses `CRUDToolBar`**; never fall back to RA's default toolbar.
- Layout with **`FormGrid`** (see Form layout below).

### Phase 6 — Generate Edit

File: `src/features/<module>/resources/<entities>/<entities>-edit.tsx`

Structure follows what the resource needs (same tabs as Create or not). Toolbar is always `CRUDToolBar`:
- `save` — almost always
- `delete` — unless the resource is non-deletable
- Extra action buttons (dialogs, navigation) go as `children`

### Phase 7 — Register + verify

1. `src/features/<module>/resources/<entities>/index.tsx` exports `export const <X>Resource = (<Resource name="..." list={...} create={...} edit={...} icon={...} />);`
2. Add it to the `resources` array of the feature barrel `src/features/<feature>/index.tsx`. That is all the registration it needs: `src/features/index.tsx` and `App.tsx` pick it up. A brand-new feature is added once to the `features` list in `src/features/index.tsx`.
3. Lookup-only resources (no CRUD pages) get a bare `<Resource name="..." />` in `App.tsx`.
4. Add its sidebar entry to `src/app/navigation.tsx`, under the module where users look for it (setup lists go under Académico or Configuración). `src/test/navigation.test.tsx` fails until the resource is reachable.
5. Add an integration test next to the List (`<entities>-list.test.tsx`): render it with `renderWithAdmin` from `@/test/render-with-admin` and a fake dataProvider, and assert that every row the API returns is shown and that the default filters are sent. `src/features/products/resources/products/products-list.test.tsx` is the template.
6. Run `npm run verify` (types, lint, tests, build) — fix everything before reporting done.

## Form layout — `FormGrid`

`src/shared/components/form-grid.tsx` is the only layout for form fields. Never use `<Box display="flex">` rows.

| Export | Use |
|---|---|
| `FormGrid` | Responsive column grid; drop RA inputs straight in, each takes one column. Pass `minColumnWidth` when the grid lives in a narrower container (dialog, side panel). |
| `FormSection` | A titled `FormGrid` for grouping related fields inside a tab. |
| `InlineFields` | One cell holding several small controls side by side (switch clusters). |
| `wideField` | `sx` for a field spanning two columns (addresses). |
| `fullRowField` | `sx` for the whole row (multiline comments, alerts, hint lines). |

```tsx
<TabbedForm.Tab label="Domicilio">
  <FormGrid>
    <TextInput source="address" label="Dirección" sx={wideField} />
    <LocationFormSelector sourcePrefix="addressLocation" />
    <TextInput source="notes" label="Notas" multiline sx={fullRowField} />
  </FormGrid>
</TabbedForm.Tab>
```

## CRUDToolBar usage

`src/app/layout/crud-toolbar.tsx` (default export). Always renders "Volver"; `save`/`delete` are opt-in.

```tsx
<CRUDToolBar save />                 // Create
<CRUDToolBar save delete />          // Edit
<CRUDToolBar save delete>            // Edit + extra actions
  <ViewEmploymentContractsButton />
</CRUDToolBar>
<CRUDToolBar>                        // custom submit handled by a child
  <ConfirmCreateButton />
</CRUDToolBar>
<Edit actions={<CRUDToolBar />}>     // no form-level save/delete (see products-edit.tsx)
```

## Universal constraints

- **Labels in Spanish** — every `label=` prop
- **Required fields**: always pair `isRequired` with `validate={required()}`
- **Imports**: relative only in the `./` form (same folder or below); anything that would need `../` goes through `@/`
- **Files**: kebab-case
- **Never invent a `reference=` name** — derive it (Phase 2) or take it from the spec
- **Never recreate a component that already exists**
