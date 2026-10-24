import { ReferenceInput, SelectInput, required } from "react-admin";
import { useWatch } from "react-hook-form";

interface LocationFormSelectorProps {
  sourcePrefix?: string;
}

const LocationFormSelector = ({ sourcePrefix }: LocationFormSelectorProps) => {
  const base = sourcePrefix ? `${sourcePrefix}.` : "";
  const departmentId = useWatch({ name: `${base}departmentId` });
  const provinceId = useWatch({ name: `${base}provinceId` });
  /*
    useEffect(() => {
        setValue(`${base}provinceId`, null);
        setValue(`${base}districtId`, null);
    }, [departmentId]);

    useEffect(() => {
        setValue(`${base}districtId`, null);
    }, [provinceId]);
*/
  return (
    <>
      <ReferenceInput source={`${base}departmentId`} reference="departments">
        <SelectInput label="Departamento" isRequired validate={required()} />
      </ReferenceInput>

      {departmentId ? (
        <ReferenceInput
          source={`${base}provinceId`}
          reference="provinces"
          filter={{ departmentId }}
        >
          <SelectInput label="Provincia" isRequired validate={required()} />
        </ReferenceInput>
      ) : (
        <SelectInput
          source={`${base}provinceId`}
          label="Provincia"
          choices={[]}
          disabled
          isRequired
          validate={required()}
        />
      )}

      {provinceId ? (
        <ReferenceInput
          source={`${base}districtId`}
          reference="districts"
          filter={{ provinceId }}
        >
          <SelectInput label="Distrito" isRequired validate={required()} />
        </ReferenceInput>
      ) : (
        <SelectInput
          source={`${base}districtId`}
          label="Distrito"
          choices={[]}
          disabled
          isRequired
          validate={required()}
        />
      )}
    </>
  );
};

export default LocationFormSelector;
