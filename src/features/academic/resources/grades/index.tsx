import { Resource } from "react-admin";
import GradeIcon from "@mui/icons-material/Grade";
import { GradesList } from "./grades-list";
import { GradesCreate } from "./grades-create";
import { GradesEdit } from "./grades-edit";

export const GradesResource = (
  <Resource
    name="grades"
    list={GradesList}
    create={GradesCreate}
    edit={GradesEdit}
    icon={GradeIcon}
  />
);
