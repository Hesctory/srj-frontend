import type { ReactElement } from "react";
import { PaymentDocumentsResource } from "./resources/payment-documents";
import { VoucherSeriesResource } from "./resources/voucher-series";

export const resources = [PaymentDocumentsResource, VoucherSeriesResource];
export const routes: ReactElement[] = [];
