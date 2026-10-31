import { useTranslate } from "react-admin";
import { useFormState } from "react-hook-form";
import CRUDToolBar from "@/app/layout/crud-toolbar";
import UnsavedChangesGuard from "@/shared/components/unsaved-changes-guard";

interface GuardedFormToolbarProps {
  /** Offer Eliminar; only for rows the contract lets staff delete. */
  delete?: boolean;
}

/**
 * Guardar and Volver, asking before "Volver" or a tab close throws away
 * typed values.
 */
const GuardedFormToolbar = ({ delete: deletable }: GuardedFormToolbarProps) => {
  const translate = useTranslate();
  const { isDirty, isSubmitting } = useFormState();
  const unsaved = isDirty && !isSubmitting;

  return (
    <>
      <UnsavedChangesGuard when={unsaved} />
      <CRUDToolBar
        save
        delete={deletable}
        onBeforeLeave={() =>
          !unsaved || window.confirm(translate("ra.message.unsaved_changes"))
        }
      />
    </>
  );
};

export default GuardedFormToolbar;
