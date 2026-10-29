import { useTranslate } from "react-admin";
import { useFormState } from "react-hook-form";
import CRUDToolBar from "@/app/layout/crud-toolbar";
import UnsavedChangesGuard from "@/shared/components/unsaved-changes-guard";

/**
 * Guardar and Volver, asking before "Volver" or a tab close throws away
 * typed amounts. Fee rows cannot be deleted, so there is no Eliminar.
 */
const SchoolFeeToolbar = () => {
  const translate = useTranslate();
  const { isDirty, isSubmitting } = useFormState();
  const unsaved = isDirty && !isSubmitting;

  return (
    <>
      <UnsavedChangesGuard when={unsaved} />
      <CRUDToolBar
        save
        onBeforeLeave={() =>
          !unsaved || window.confirm(translate("ra.message.unsaved_changes"))
        }
      />
    </>
  );
};

export default SchoolFeeToolbar;
