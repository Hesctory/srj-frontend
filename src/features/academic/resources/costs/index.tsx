import { Resource } from "react-admin";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { CostsList } from "./costs-list";
import { CostsCreate } from "./costs-create";
import { CostsEdit } from "./costs-edit";

export const CostsResource = (
  <Resource
    name="costs"
    list={CostsList}
    create={CostsCreate}
    edit={CostsEdit}
    icon={AttachMoneyIcon}
  />
);
