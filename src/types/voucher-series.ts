// Electronic-invoicing document series per institution (Boletas, Facturas,
// Notas de Crédito). Bodies are camelCase; `id` stays lowercase.

// Shape returned by GET /voucher-series (list) and GET /voucher-series/{id}.
export interface VoucherSeriesListDTO {
  id: number;
  voucherType: string;
  institutionId: number;
  series: string;
}

// Body sent to POST and PUT /voucher-series.
export interface CreateVoucherSeriesDTO {
  voucherType: string;
  institutionId: number;
  series: string;
}
