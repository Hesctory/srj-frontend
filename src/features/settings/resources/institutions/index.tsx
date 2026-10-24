import { Resource } from "react-admin";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import { InstitutionsList } from "./institutions-list";
import { InstitutionsEdit } from "./institutions-edit";
import { InstitutionsCreate } from "./institutions-create";

export const InstitutionsResource = (
  <Resource
    name="institutions"
    list={InstitutionsList}
    edit={InstitutionsEdit}
    create={InstitutionsCreate}
    icon={CorporateFareIcon}
  />
);
