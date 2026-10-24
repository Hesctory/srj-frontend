import {
  DataTable,
  EditButton,
  List,
  ReferenceField,
  TextField,
  useRecordContext,
} from "react-admin";
import SchoolYearFilter from "@/shared/components/school-year-filter";

const GradeName = () => {
  const grade = useRecordContext();
  if (!grade) return null;
  return (
    <span>
      {grade.name}{" "}
      <ReferenceField source="levelId" reference="levels" link={false}>
        <TextField source="name" />
      </ReferenceField>
    </span>
  );
};

const gradeOfferingsFilters = [
  <SchoolYearFilter key="schoolYearId" alwaysOn />,
];

export const GradeOfferingsList = () => (
  <List filters={gradeOfferingsFilters} debounce={500}>
    <DataTable>
      <DataTable.Col
        source="schoolYearId"
        label="Año Escolar"
        sx={{ width: "15%" }}
      >
        <ReferenceField
          source="schoolYearId"
          reference="school-years"
          link={false}
        >
          <TextField source="year" />
        </ReferenceField>
      </DataTable.Col>
      <DataTable.Col source="gradeId" label="Grado" sx={{ width: "40%" }}>
        <ReferenceField source="gradeId" reference="grades" link={false}>
          <GradeName />
        </ReferenceField>
      </DataTable.Col>
      <DataTable.Col source="shiftId" label="Turno" sx={{ width: "25%" }}>
        <ReferenceField source="shiftId" reference="shifts" link={false}>
          <TextField source="name" />
        </ReferenceField>
      </DataTable.Col>
      <DataTable.Col source="sections" label="Secciones" sx={{ width: "15%" }}>
        <TextField source="sections" />
      </DataTable.Col>
      <DataTable.Col label="" sx={{ width: 1, whiteSpace: "nowrap" }}>
        <EditButton />
      </DataTable.Col>
    </DataTable>
  </List>
);
