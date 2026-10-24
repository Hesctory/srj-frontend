import { Resource } from "react-admin";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { VoucherSeriesList } from "./voucher-series-list";
import { VoucherSeriesCreate } from "./voucher-series-create";
import { VoucherSeriesEdit } from "./voucher-series-edit";

export const VoucherSeriesResource = (
  <Resource
    name="voucher-series"
    list={VoucherSeriesList}
    create={VoucherSeriesCreate}
    edit={VoucherSeriesEdit}
    icon={ReceiptLongIcon}
  />
);
