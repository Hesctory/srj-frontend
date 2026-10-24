import { Resource } from "react-admin";
import CategoryIcon from "@mui/icons-material/Category";
import { WorkAreasList } from "./work-areas-list";
import { WorkAreasCreate } from "./work-areas-create";
import { WorkAreasEdit } from "./work-areas-edit";

export const WorkAreasResource = (
  <Resource
    name="work-areas"
    list={WorkAreasList}
    create={WorkAreasCreate}
    edit={WorkAreasEdit}
    icon={CategoryIcon}
  />
);
