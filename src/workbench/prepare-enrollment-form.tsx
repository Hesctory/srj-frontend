import { useEffect, useRef, useState } from "react";
import {
  ACADEMIC_MISSING,
  AcademicFields,
  academicBody,
  EMPTY_ACADEMIC,
  useBusinessDateField,
} from "./academic-fields";
import { ActionPanel, type BuiltInputs } from "./action-panel";
import { numberOrNull } from "./format";
import { panelStore, usePanelState } from "./panel-store";
import { Section } from "./section";
import { StudentPicker } from "./student-picker";
import { useWorkbench } from "./workbench-context";

export const PrepareEnrollmentForm = () => {
  const { options } = useWorkbench();
  const { prefill } = usePanelState();
  const [open, setOpen] = useState(false);
  const [existing, setExisting] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [academic, setAcademic] = useState(EMPTY_ACADEMIC);
  const [enrollmentDate, setEnrollmentDate] = useBusinessDateField();
  const sectionRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (prefill?.action !== "prepare-enrollment") return;
    setExisting(true);
    setStudentId(String(prefill.studentId));
    setOpen(true);
    panelStore.clearPrefill();
    sectionRef.current?.scrollIntoView?.({ block: "start" });
  }, [prefill]);

  const build = (): BuiltInputs => {
    const id = existing ? numberOrNull(studentId) : null;
    if (existing && !id)
      return { error: "Elige un alumno existente o escribe su id." };
    const academicPart = academicBody(options, academic);
    if (!academicPart) return { error: ACADEMIC_MISSING };
    if (!enrollmentDate) return { error: "Elige una fecha de matrícula." };
    return { body: { studentId: id, ...academicPart, enrollmentDate } };
  };

  return (
    <Section
      title="Preparar matrícula"
      open={open}
      onOpenChange={setOpen}
      sectionRef={sectionRef}
    >
      <div className="wb-grid">
        <label>
          Alumno
          <select
            value={existing ? "existing" : "new"}
            onChange={(event) => setExisting(event.target.value === "existing")}
          >
            <option value="new">Alumno nuevo</option>
            <option value="existing">Alumno existente</option>
          </select>
        </label>
        {existing && (
          <StudentPicker studentId={studentId} onChange={setStudentId} />
        )}
        <AcademicFields value={academic} onChange={setAcademic} />
        <label>
          Fecha de matrícula
          <input
            type="date"
            value={enrollmentDate}
            onChange={(event) => setEnrollmentDate(event.target.value)}
          />
        </label>
      </div>
      <ActionPanel name="prepare-enrollment" built={build()} />
    </Section>
  );
};
