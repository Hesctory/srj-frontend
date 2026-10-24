import { Resource } from "react-admin";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import { GradeOfferingsList } from "./grade-offerings-list";
import { GradeOfferingsCreate } from "./grade-offerings-create";
import { GradeOfferingsEdit } from "./grade-offerings-edit";

export const GradeOfferingsResource = (
  <Resource
    name="grade-offerings"
    list={GradeOfferingsList}
    create={GradeOfferingsCreate}
    edit={GradeOfferingsEdit}
    icon={ViewModuleIcon}
  />
);
