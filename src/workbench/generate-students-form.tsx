import { useState } from "react";
import {
  ACADEMIC_MISSING,
  AcademicFields,
  academicBody,
  EMPTY_ACADEMIC,
  useBusinessDateField,
} from "./academic-fields";
import { ActionPanel, type BuiltInputs } from "./action-panel";
import { Section } from "./section";
import { useWorkbench } from "./workbench-context";

export const GenerateStudentsForm = () => {
  const { options } = useWorkbench();
  const [count, setCount] = useState("1");
  const [academic, setAcademic] = useState(EMPTY_ACADEMIC);
  const [enrollmentDate, setEnrollmentDate] = useBusinessDateField();

  const build = (): BuiltInputs => {
    const parsed = Number(count);
    if (!Number.isInteger(parsed) || parsed < 1)
      return { error: "Indica cuántos alumnos generar (1 o más)." };
    const academicPart = academicBody(options, academic);
    if (!academicPart) return { error: ACADEMIC_MISSING };
    if (!enrollmentDate) return { error: "Elige una fecha de matrícula." };
    return { body: { count: parsed, ...academicPart, enrollmentDate } };
  };

  return (
    <Section title="Generar alumnos">
      <div className="wb-grid">
        <label>
          Cantidad
          <input
            type="number"
            min={1}
            max={500}
            value={count}
            onChange={(event) => setCount(event.target.value)}
          />
        </label>
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
      <ActionPanel name="generate-students" built={build()} />
    </Section>
  );
};
