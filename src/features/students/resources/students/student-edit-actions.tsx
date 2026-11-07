import { TopToolbar, useRecordContext } from "react-admin";
import { DevWorkbenchButton } from "@/shared/components/dev-workbench";

/**
 * The student page's top actions. Today there is only the development
 * workbench's "prepare an enrollment for this student"; in a production build
 * this renders nothing, not even an empty toolbar.
 */
const StudentEditActions = () => {
  const record = useRecordContext<{ id: number }>();
  if (!import.meta.env.DEV || !record) return null;
  return (
    <TopToolbar>
      <DevWorkbenchButton
        action="prepare-enrollment"
        studentId={Number(record.id)}
      />
    </TopToolbar>
  );
};

export default StudentEditActions;
