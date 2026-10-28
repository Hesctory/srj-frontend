import { Resource } from "react-admin";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { SchoolFeesList } from "./school-fees-list";
import { SchoolFeesCreate } from "./school-fees-create";
import { SchoolFeesEdit } from "./school-fees-edit";

export const SchoolFeesResource = (
  <Resource
    name="school-fees"
    list={SchoolFeesList}
    create={SchoolFeesCreate}
    edit={SchoolFeesEdit}
    icon={AttachMoneyIcon}
  />
);
