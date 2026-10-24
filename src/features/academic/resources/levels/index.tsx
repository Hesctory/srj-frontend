import { Resource } from "react-admin";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import { LevelsList } from "./levels-list";
import { LevelsCreate } from "./levels-create";
import { LevelsEdit } from "./levels-edit";

export const LevelsResource = (
  <Resource
    name="levels"
    list={LevelsList}
    create={LevelsCreate}
    edit={LevelsEdit}
    icon={AccountTreeIcon}
  />
);
