import { Resource } from "react-admin";
import SchoolIcon from "@mui/icons-material/School";
import { StudentsList } from "./students-list";
import { StudentCreate } from "./student-create";
import { StudentEdit } from "./student-edit";

export const StudentsResource = (
  <Resource
    name="students"
    list={StudentsList}
    create={StudentCreate}
    edit={StudentEdit}
    icon={SchoolIcon}
    options={{ label: "Estudiantes" }}
  />
);
