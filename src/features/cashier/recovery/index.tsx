import type { ReactElement } from "react";
import { PaymentRecoveryCasesResource } from "./resources/payment-recovery-cases";

export { useOpenRecoveryCase } from "./hooks/use-open-recovery-case";
export { useRecoveryReviewCount } from "./hooks/use-review-count";

export const recoveryResources = [PaymentRecoveryCasesResource];
export const recoveryRoutes: ReactElement[] = [];
