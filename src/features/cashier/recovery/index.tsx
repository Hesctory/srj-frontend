import type { ReactElement } from "react";
import { PaymentRecoveryCasesResource } from "./resources/payment-recovery-cases";

export { useOpenRecoveryCase } from "./hooks/use-open-recovery-case";
export { useRecoveryReviewCount } from "./hooks/use-review-count";
export { default as CorrectionDialog } from "./components/correction-dialog";
export { default as CorrectButton } from "./components/correct-button";
export { default as OpenCaseLink } from "./components/open-case-link";

export const recoveryResources = [PaymentRecoveryCasesResource];
export const recoveryRoutes: ReactElement[] = [];
