import { Resource } from "react-admin";
import GroupIcon from "@mui/icons-material/Group";
import { StaffMembersList } from "./staff-members-list";
import { StaffMembersEdit } from "./staff-members-edit";
import { StaffMembersCreate } from "./staff-members-create";

export const StaffMembersResource = (
  <Resource
    name="staff-members"
    list={StaffMembersList}
    edit={StaffMembersEdit}
    create={StaffMembersCreate}
    icon={GroupIcon}
  />
);
