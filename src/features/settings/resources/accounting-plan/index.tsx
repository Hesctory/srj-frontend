import { Resource } from "react-admin";
import SavingsIcon from "@mui/icons-material/Savings";
import { AccountingPlanList } from "./accounting-plan-list";
import { AccountingPlanCreate } from "./accounting-plan-create";
import { AccountingPlanEdit } from "./accounting-plan-edit";

export const AccountingPlanResource = (
  <Resource
    name="accounting-plan"
    list={AccountingPlanList}
    create={AccountingPlanCreate}
    edit={AccountingPlanEdit}
    icon={SavingsIcon}
  />
);
