import { useEffect, useRef, useState } from "react";
import { ActionPanel, type BuiltInputs } from "./action-panel";
import { workbench } from "./client";
import { numberOrNull } from "./format";
import { panelStore, usePanelState } from "./panel-store";
import {
  buildPlan,
  INITIAL_PLAN,
  PaymentPlanFields,
  type PlanState,
} from "./payment-plan-fields";
import { Section } from "./section";
import { StudentPicker } from "./student-picker";
import { useWorkbench } from "./workbench-context";
import type { PaymentPlanKind, WorkbenchOptions } from "./types";

const ID_DEBOUNCE_MS = 300;

type Enrollments = NonNullable<WorkbenchOptions["enrollments"]>;
type Charges = NonNullable<WorkbenchOptions["charges"]>;

export const PreparePaymentsForm = () => {
  const { options, status, generation } = useWorkbench();
  const { prefill } = usePanelState();
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [enrollmentId, setEnrollmentId] = useState("");
  const [enrollments, setEnrollments] = useState<Enrollments | null>(null);
  const [charges, setCharges] = useState<Charges | null>(null);
  const [loading, setLoading] = useState(false);
  const [methodId, setMethodId] = useState("");
  const [issueDocuments, setIssueDocuments] = useState(true);
  const [includeEnrollmentCharges, setIncludeEnrollmentCharges] =
    useState(true);
  const [plan, setPlan] = useState<PlanState>(INITIAL_PLAN);
  const sectionRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (prefill?.action !== "prepare-payments") return;
    setStudentId(String(prefill.studentId));
    setEnrollmentId(String(prefill.enrollmentId));
    setOpen(true);
    panelStore.clearPrefill();
    sectionRef.current?.scrollIntoView?.({ block: "start" });
  }, [prefill]);

  // The student's enrollments, then the chosen enrollment's charges. They
  // reload after every operation (an execute may have paid some).
  useEffect(() => {
    const student = numberOrNull(studentId);
    const enrollment = numberOrNull(enrollmentId);
    if (!student) {
      setEnrollments(null);
      setCharges(null);
      return;
    }
    let current = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      const query = enrollment
        ? `/options?studentId=${student}&enrollmentId=${enrollment}`
        : `/options?studentId=${student}`;
      const res = await workbench.get<WorkbenchOptions>(query);
      if (!current) return;
      setEnrollments(res.ok ? (res.data.enrollments ?? []) : []);
      setCharges(res.ok ? (res.data.charges ?? null) : null);
      setLoading(false);
    }, ID_DEBOUNCE_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [studentId, enrollmentId, generation]);

  const chooseStudent = (id: string) => {
    setStudentId(id);
    setEnrollmentId("");
  };

  const build = (): BuiltInputs => {
    const enrollment = numberOrNull(enrollmentId);
    if (!numberOrNull(studentId) || !enrollment)
      return { error: "Elige un alumno y una de sus matrículas." };
    const method = numberOrNull(methodId);
    if (!method) return { error: "Elige un medio de pago." };
    const planPart = buildPlan(plan, charges ?? []);
    if ("error" in planPart) return planPart;
    return {
      body: {
        enrollmentId: enrollment,
        kind: plan.kind,
        includeEnrollmentCharges,
        paymentMethodId: method,
        issueDocuments,
        ...planPart.fields,
      },
    };
  };

  const changeKind = (kind: PaymentPlanKind) =>
    setPlan((current) => ({
      ...current,
      kind,
      partials:
        kind === "partialAmounts" && !current.partials.length
          ? [{ key: 0, amount: "", date: status?.businessDate ?? "" }]
          : current.partials,
    }));

  return (
    <Section
      title="Preparar pagos"
      open={open}
      onOpenChange={setOpen}
      sectionRef={sectionRef}
    >
      <div className="wb-grid">
        <StudentPicker studentId={studentId} onChange={chooseStudent} />
        <label>
          Matrícula
          <select
            value={enrollmentId}
            disabled={loading && !enrollments}
            onChange={(event) => setEnrollmentId(event.target.value)}
          >
            <option value="">
              {loading && !enrollments ? "cargando…" : "elegir…"}
            </option>
            {enrollments?.map((enrollment) => (
              <option key={enrollment.id} value={enrollment.id}>
                #{enrollment.id} · {enrollment.year} · {enrollment.gradeName} ·
                matriculado {enrollment.enrollmentDate}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tipo
          <select
            value={plan.kind}
            onChange={(event) =>
              changeKind(event.target.value as PaymentPlanKind)
            }
          >
            <option value="firstMonths">Primeros N meses</option>
            <option value="chosenMonths">Meses elegidos</option>
            <option value="partialAmounts">Montos parciales</option>
          </select>
        </label>
        <label>
          Medio de pago
          <select
            value={methodId}
            onChange={(event) => setMethodId(event.target.value)}
          >
            <option value="">elegir…</option>
            {options?.paymentMethods.map((method) => (
              <option key={method.id} value={method.id}>
                {method.name}
              </option>
            ))}
          </select>
        </label>
        <label className="wb-check">
          <input
            type="checkbox"
            checked={issueDocuments}
            onChange={(event) => setIssueDocuments(event.target.checked)}
          />
          Emitir comprobantes
        </label>
        <label className="wb-check">
          <input
            type="checkbox"
            checked={includeEnrollmentCharges}
            onChange={(event) =>
              setIncludeEnrollmentCharges(event.target.checked)
            }
          />
          Incluir cargos de matrícula (matrícula, ingreso)
        </label>
      </div>
      <PaymentPlanFields
        plan={plan}
        onChange={setPlan}
        charges={charges}
        chargesLoading={loading}
        businessDate={status?.businessDate ?? ""}
      />
      <ActionPanel
        name="prepare-payments"
        built={build()}
        previewBlocked={loading || !numberOrNull(enrollmentId)}
        previewBlockedReason={
          loading
            ? "Cargando las matrículas y cargos…"
            : "Elige un alumno y una matrícula."
        }
      />
    </Section>
  );
};
