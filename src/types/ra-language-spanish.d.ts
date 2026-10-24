// `ra-language-spanish` (v1.0.0) ships no TypeScript declarations, so importing it
// triggers an implicit-`any` error under `strict`. Declare its shape here: a single
// default export of RA translation messages, typed against ra-core.
declare module "ra-language-spanish" {
  import type { TranslationMessages } from "ra-core";
  const spanishMessages: TranslationMessages;
  export default spanishMessages;
}
