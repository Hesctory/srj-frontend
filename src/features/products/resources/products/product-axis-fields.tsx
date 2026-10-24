import { ReferenceInput, SelectInput } from "react-admin";
import { useWatch } from "react-hook-form";
import { PRODUCT_TYPE_GARMENT } from "./product-constants";

/**
 * The line's own attributes, which depend on the product type.
 *
 * A garment names a gender and a size scale; a book names neither, because its
 * publisher belongs to the *version* (a change of publisher is a new edition,
 * not an edit) and its grade belongs to the *variant*. "Otro" names nothing at
 * all.
 */
export const ProductLineFields = () => {
  const productTypeId = Number(useWatch({ name: "productTypeId" }));

  if (productTypeId !== PRODUCT_TYPE_GARMENT) return null;

  return (
    <>
      <ReferenceInput source="garmentGenderId" reference="garment-genders">
        <SelectInput optionText="name" label="Género" />
      </ReferenceInput>
      <ReferenceInput source="sizeScaleId" reference="sizes/scales">
        <SelectInput optionText="name" label="Escala de tallas" />
      </ReferenceInput>
    </>
  );
};
