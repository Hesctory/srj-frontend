import {
  Create,
  maxLength,
  ReferenceInput,
  required,
  SelectInput,
  SimpleForm,
  TextInput,
} from "react-admin";
import { voucherTypeChoices } from "./voucher-type-choices";
import CRUDToolBar from "@/app/layout/crud-toolbar";

export const VoucherSeriesCreate = () => (
  <Create redirect="list" mutationMode="pessimistic">
    <SimpleForm toolbar={<CRUDToolBar save />}>
      <SelectInput
        source="voucherType"
        label="Tipo de Comprobante"
        choices={voucherTypeChoices}
        isRequired
        validate={required()}
      />
      <ReferenceInput source="institutionId" reference="institutions">
        <SelectInput label="Institución" isRequired validate={required()} />
      </ReferenceInput>
      <TextInput
        source="series"
        label="Serie"
        isRequired
        validate={[required(), maxLength(10)]}
      />
    </SimpleForm>
  </Create>
);
