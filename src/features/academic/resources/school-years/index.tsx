import { Resource } from "react-admin";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { SchoolYearsList } from "./school-years-list";
import { SchoolYearsEdit } from "./school-years-edit";
import { SchoolYearsCreate } from "./school-years-create";

export const SchoolYearsResource = (
  <Resource
    name="school-years"
    list={SchoolYearsList}
    edit={SchoolYearsEdit}
    create={SchoolYearsCreate}
    icon={CalendarTodayIcon}
  />
);
