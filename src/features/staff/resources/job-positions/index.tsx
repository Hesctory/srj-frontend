import { Resource } from "react-admin";
import WorkIcon from "@mui/icons-material/Work";
import { JobPositionsList } from "./job-positions-list";
import { JobPositionsCreate } from "./job-positions-create";
import { JobPositionsEdit } from "./job-positions-edit";

export const JobPositionsResource = (
  <Resource
    name="job-positions"
    list={JobPositionsList}
    create={JobPositionsCreate}
    edit={JobPositionsEdit}
    icon={WorkIcon}
  />
);
