import { numberOrNull } from "./format";
import type { PaymentPlanKind, WorkbenchOptions } from "./types";

type Charge = NonNullable<WorkbenchOptions["charges"]>[number];

export interface PlanState {
  kind: PaymentPlanKind;
  monthCount: string;
  /** Month number → ticked and optional payment date. */
  chosen: Record<number, { checked: boolean; date: string }>;
  partials: { key: number; amount: string; date: string }[];
}

export const INITIAL_PLAN: PlanState = {
  kind: "firstMonths",
  monthCount: "1",
  chosen: {},
  partials: [],
};

export const monthlyCharges = (charges: Charge[]) =>
  charges.filter((charge) => charge.month != null);

/** The plan part of the payments body, or why it is not complete. */
export const buildPlan = (
  plan: PlanState,
  charges: Charge[],
): { fields: Record<string, unknown> } | { error: string } => {
  if (plan.kind === "firstMonths") {
    const count = numberOrNull(plan.monthCount);
    if (!count || count < 1) return { error: "Indica cuántos meses pagar." };
    return { fields: { monthCount: count } };
  }
  if (plan.kind === "chosenMonths") {
    const months = monthlyCharges(charges)
      .filter((charge) => plan.chosen[charge.month!]?.checked)
      .map((charge) => ({
        month: charge.month!,
        date: plan.chosen[charge.month!]?.date || null,
      }));
    if (!months.length) return { error: "Marca al menos un mes." };
    return { fields: { months } };
  }
  const partials = plan.partials.map((row) => ({
    amount: numberOrNull(row.amount),
    date: row.date,
  }));
  if (
    !partials.length ||
    partials.some((row) => !row.amount || row.amount <= 0 || !row.date)
  )
    return {
      error: "Cada pago parcial necesita un monto mayor que cero y una fecha.",
    };
  return { fields: { partials } };
};

let nextKey = 1;

export const PaymentPlanFields = ({
  plan,
  onChange,
  charges,
  chargesLoading,
  businessDate,
}: {
  plan: PlanState;
  onChange: (plan: PlanState) => void;
  charges: Charge[] | null;
  chargesLoading: boolean;
  businessDate: string;
}) => {
  const monthly = monthlyCharges(charges ?? []);
  const addPartial = () =>
    onChange({
      ...plan,
      partials: [
        ...plan.partials,
        { key: nextKey++, amount: "", date: businessDate },
      ],
    });

  if (plan.kind === "firstMonths")
    return (
      <label className="wb-field">
        Meses
        <input
          type="number"
          min={1}
          max={!chargesLoading && monthly.length ? monthly.length : undefined}
          value={plan.monthCount}
          onChange={(event) =>
            onChange({ ...plan, monthCount: event.target.value })
          }
        />
      </label>
    );

  if (plan.kind === "chosenMonths") {
    if (chargesLoading) return <div className="wb-hint">cargando…</div>;
    if (!monthly.length)
      return (
        <div className="wb-hint">
          Elige un alumno y una matrícula para ver sus cargos.
        </div>
      );
    return (
      <div>
        {monthly.map((charge) => {
          const entry = plan.chosen[charge.month!] ?? {
            checked: false,
            date: "",
          };
          const set = (patch: Partial<typeof entry>) =>
            onChange({
              ...plan,
              chosen: {
                ...plan.chosen,
                [charge.month!]: { ...entry, ...patch },
              },
            });
          return (
            <div key={charge.id} className="wb-row">
              <label className="wb-check wb-field">
                <input
                  type="checkbox"
                  checked={entry.checked}
                  onChange={(event) => set({ checked: event.target.checked })}
                />
                <span>
                  {charge.monthName ?? charge.month} — {charge.type} —{" "}
                  {charge.outstanding} pendiente, vence {charge.dueDate} (
                  {charge.status})
                </span>
              </label>
              <input
                type="date"
                aria-label={`Fecha de pago de ${charge.monthName ?? charge.month} (opcional)`}
                value={entry.date}
                onChange={(event) => set({ date: event.target.value })}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      {plan.partials.map((row, index) => {
        const set = (patch: Partial<typeof row>) =>
          onChange({
            ...plan,
            partials: plan.partials.map((other) =>
              other.key === row.key ? { ...other, ...patch } : other,
            ),
          });
        return (
          <div key={row.key} className="wb-row">
            <input
              type="number"
              min={0.01}
              step={0.01}
              placeholder="monto"
              aria-label={`Monto ${index + 1}`}
              value={row.amount}
              onChange={(event) => set({ amount: event.target.value })}
            />
            <input
              type="date"
              aria-label={`Fecha ${index + 1}`}
              value={row.date}
              onChange={(event) => set({ date: event.target.value })}
            />
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...plan,
                  partials: plan.partials.filter(
                    (other) => other.key !== row.key,
                  ),
                })
              }
            >
              quitar
            </button>
          </div>
        );
      })}
      <button type="button" onClick={addPartial}>
        Añadir monto
      </button>
    </div>
  );
};
