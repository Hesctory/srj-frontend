import { ReferenceArrayInput, SelectArrayInput } from "react-admin";
import { useWatch } from "react-hook-form";

interface SecondLanguagesFormSelectorProps {
  sourcePrefix?: string;
}

const SecondLanguagesFormSelector = ({
  sourcePrefix,
}: SecondLanguagesFormSelectorProps) => {
  const base = sourcePrefix ? `${sourcePrefix}.` : "";
  const nativeLanguageId = useWatch({ name: `${base}nativeLanguageId` });

  return (
    <ReferenceArrayInput
      source={`${base}secondLanguageIds`}
      reference="languages"
      filter={nativeLanguageId ? { exclude: nativeLanguageId } : undefined}
    >
      <SelectArrayInput label="Segundas Lenguas" />
    </ReferenceArrayInput>
  );
};

export default SecondLanguagesFormSelector;
