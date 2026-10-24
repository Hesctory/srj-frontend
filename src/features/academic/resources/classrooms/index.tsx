import { Resource } from "react-admin";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import { ClassroomsList } from "./classrooms-list";
import { ClassroomsCreate } from "./classrooms-create";
import { ClassroomsEdit } from "./classrooms-edit";

export const ClassroomsResource = (
  <Resource
    name="classrooms"
    list={ClassroomsList}
    create={ClassroomsCreate}
    edit={ClassroomsEdit}
    icon={MeetingRoomIcon}
  />
);
