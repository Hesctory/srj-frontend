import { Resource } from "react-admin";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { SchoolFeeConceptsList } from "./school-fee-concepts-list";
import { SchoolFeeConceptsCreate } from "./school-fee-concepts-create";
import { SchoolFeeConceptsEdit } from "./school-fee-concepts-edit";

export const SchoolFeeConceptsResource = (
  <Resource
    name="school-fee-concepts"
    list={SchoolFeeConceptsList}
    create={SchoolFeeConceptsCreate}
    edit={SchoolFeeConceptsEdit}
    icon={LocalOfferIcon}
    recordRepresentation="name"
  />
);
