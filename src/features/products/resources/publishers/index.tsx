import { Resource } from "react-admin";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { PublishersList } from "./publishers-list";
import { PublishersEdit } from "./publishers-edit";
import { PublishersCreate } from "./publishers-create";

export const PublishersResource = (
  <Resource
    name="publishers"
    list={PublishersList}
    edit={PublishersEdit}
    create={PublishersCreate}
    icon={MenuBookIcon}
  />
);
