import type { ReactElement } from "react";
import { PaymentDocumentsResource } from "./resources/payment-documents";
import { VoucherSeriesResource } from "./resources/voucher-series";

export { default as IssueDocumentDialog } from "./components/issue-document-dialog";

export const resources = [PaymentDocumentsResource, VoucherSeriesResource];
export const routes: ReactElement[] = [];
