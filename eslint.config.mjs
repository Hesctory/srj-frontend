import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

// --- Architecture rules -------------------------------------------------------
// Rules from CLAUDE.md that a machine can check live here instead of in prose.
// Every message says how to fix the violation, because the reader is usually
// an agent that will act on it directly. When one of these rules is added
// because of a real failure, say in a comment next to it what went wrong.

const DATA_PROVIDER_MESSAGE =
  "Only src/app/ talks HTTP. Add a method to the dataProvider in " +
  "src/app/data-provider.ts (or a URL mapping for an unusual endpoint) and " +
  "call it from the feature with useDataProvider() inside useQuery/" +
  "useMutation from @tanstack/react-query (React Admin's own data layer). " +
  "Do not create " +
  "src/features/<module>/api/ folders.";

const restrictedPaths = {
  httpInternals: {
    name: "@/app/data-provider",
    importNames: ["httpClient", "API_URL"],
    message: DATA_PROVIDER_MESSAGE,
  },
  datagrid: {
    name: "react-admin",
    importNames: ["Datagrid"],
    message:
      "Lists use <DataTable> with <DataTable.Col>, never Datagrid (CLAUDE.md → React Admin conventions).",
  },
  guessers: {
    name: "react-admin",
    importNames: ["ListGuesser", "EditGuesser", "ShowGuesser"],
    message:
      "Guessers are scaffolding only. Write a real List/Edit/Show (follow the ra-resource-creator skill).",
  },
};

const PARENT_IMPORT_PATTERN = {
  // `../../../public/x.png` is the one allowed parent import: public/ sits
  // outside src/ and outside the @/ alias.
  regex: "^\\.\\./(?!(\\.\\./)*public/)",
  message:
    "Relative imports only go down (./). Use the @/ alias instead of ../ (CLAUDE.md → Imports).",
};

const restrictedImports = (...paths) => [
  "error",
  {
    paths: paths.map((key) => restrictedPaths[key]),
    patterns: [PARENT_IMPORT_PATTERN],
  },
];

const restrictedHttpGlobals = [
  "error",
  { name: "fetch", message: DATA_PROVIDER_MESSAGE },
  { name: "XMLHttpRequest", message: DATA_PROVIDER_MESSAGE },
];

// Violations that predate a rule. They are listed so the rule can be an error
// everywhere else today; each entry is debt, not precedent. Do not copy these
// files' patterns and do not add entries without the user's approval — fix the
// code instead. Remove an entry as soon as its file is migrated.
const LEGACY_HTTP_OUTSIDE_APP = [
  // TODO: move these endpoints into src/app/data-provider.ts.
  "src/features/billing/api/payment-documents.ts",
];
const LEGACY_LONG_FILES = [
  // TODO: split. Files over the max-lines budget when the rule was added.
  "src/features/billing/components/issue-document-dialog.tsx",
  "src/features/billing/resources/payment-documents/payment-document-show.tsx",
];

export default defineConfig([
  globalIgnores(["**/node_modules", "**/dist"]),
  {
    name: "eslint-js-recommended-rules",
    plugins: {
      js,
    },
    extends: ["js/recommended"],
  },
  tseslint.configs.recommended.map((conf) => ({
    ...conf,
    files: ["**/*.ts", "**/*.tsx"],
  })),
  eslintPluginPrettierRecommended,
  {
    name: "react",
    ...react.configs.flat.recommended,
  },
  reactHooks.configs["recommended-latest"],
  {
    name: "naming-convention",
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        // Variables: camelCase for values, UPPER_CASE for module constants,
        // PascalCase for React components declared as `const X = () => <jsx/>`.
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE", "PascalCase"],
          leadingUnderscore: "allow",
        },
        // Functions: camelCase, or PascalCase for `function MyComponent()`.
        { selector: "function", format: ["camelCase", "PascalCase"] },
        {
          selector: "parameter",
          format: ["camelCase", "PascalCase"],
          leadingUnderscore: "allow",
        },
        // Classes, interfaces, type aliases, enums, type params.
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "enumMember", format: ["PascalCase"] },
        // Our own type/interface members must be camelCase.
        {
          selector: ["typeProperty", "typeMethod"],
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        // Object literal keys are exempt: react-admin i18n keys are snake_case
        // and API payloads may use backend-defined casing.
        { selector: "objectLiteralProperty", format: null },
        { selector: "import", format: ["camelCase", "PascalCase"] },
      ],
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    name: "hygiene",
    linterOptions: { reportUnusedDisableDirectives: "error" },
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // `_name` marks a value that is deliberately unused, and destructuring a
      // key out to drop it (`const { _levelId, ...rest } = data`) is fine.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    name: "architecture",
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
      "no-restricted-imports": restrictedImports(
        "httpInternals",
        "datagrid",
        "guessers",
      ),
      "no-restricted-globals": restrictedHttpGlobals,
      // A file past this budget is doing several jobs; split it by job before
      // adding more. Comments are not counted.
      "max-lines": [
        "error",
        { max: 400, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    name: "architecture/app-shell",
    // The app shell owns HTTP: data-provider.ts and auth-provider.ts.
    files: ["src/app/**/*.ts", "src/app/**/*.tsx"],
    rules: {
      "no-restricted-imports": restrictedImports("datagrid", "guessers"),
      "no-restricted-globals": "off",
    },
  },
  {
    name: "architecture/tests",
    files: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/test/**"],
    rules: {
      "no-restricted-globals": "off",
      "max-lines": "off",
    },
  },
  {
    name: "architecture/legacy-http",
    files: LEGACY_HTTP_OUTSIDE_APP,
    rules: {
      "no-restricted-imports": restrictedImports("datagrid", "guessers"),
    },
  },
  {
    name: "architecture/legacy-long-files",
    files: LEGACY_LONG_FILES,
    rules: { "max-lines": "off" },
  },
]);
