import { useEffect, useState } from "react";
import { workbench } from "./client";
import { OUTCOME_LABELS } from "./format";
import { Section } from "./section";
import { useWorkbench } from "./workbench-context";
import type { NubefactMode } from "./types";

const OUTCOMES = [
  "reject",
  "timeout",
  "timeout-registered",
  "taken",
  "pending",
] as const;

export const DateSection = () => {
  const { status, operate, showRefusal } = useWorkbench();
  const [date, setDate] = useState<string | null>(null);
  const value = date ?? status?.businessDate ?? "";

  const apply = async () => {
    if (!value) return showRefusal("Elige una fecha primero.");
    await operate("POST", "/workspace/date", { date: value }, true);
    setDate(null);
  };

  return (
    <Section title="Fecha de negocio" defaultOpen>
      <div className="wb-row">
        <input
          type="date"
          aria-label="Nueva fecha de negocio"
          min={status?.businessDate}
          value={value}
          onChange={(event) => setDate(event.target.value)}
        />
        <button
          type="button"
          onClick={apply}
          disabled={!value || value === status?.businessDate}
        >
          Aplicar
        </button>
        <button
          type="button"
          onClick={() =>
            operate("POST", "/workspace/follow-today", undefined, true)
          }
        >
          Seguir hoy real
        </button>
      </div>
      <div className="wb-hint">
        La fecha solo avanza. Aplicarla o seguir a hoy reinicia el backend.
      </div>
    </Section>
  );
};

const SimulatedQueue = () => {
  const { generation, status, track, showRefusal, clearMessages } =
    useWorkbench();
  const [queue, setQueue] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    void workbench.get<{ queue: string[] }>("/simulated/next").then((res) => {
      if (!current) return;
      setQueue(res.ok ? res.data.queue : null);
      setError(res.ok ? null : res.message);
    });
    return () => {
      current = false;
    };
    // Reloaded with every status poll: a send from the app consumes the queue
    // without the console knowing.
  }, [generation, status]);

  const push = async (outcome: string) => {
    clearMessages();
    const res = await track(() =>
      workbench.post<{ queue: string[] }>("/simulated/next", { outcome }),
    );
    if (res.ok) setQueue(res.data.queue);
    else showRefusal(res.message);
  };

  return (
    <div>
      <div className="wb-row">
        <span>Encolar el próximo resultado:</span>
        {OUTCOMES.map((outcome) => (
          <button
            key={outcome}
            type="button"
            title={outcome}
            onClick={() => push(outcome)}
          >
            {OUTCOME_LABELS[outcome]}
          </button>
        ))}
      </div>
      {error ? (
        <div className="wb-msg wb-bad">{error}</div>
      ) : (
        <div>
          Cola:{" "}
          <code>
            {queue === null
              ? "cargando…"
              : queue.length
                ? queue
                    .map((outcome) => OUTCOME_LABELS[outcome] ?? outcome)
                    .join(" → ")
                : "vacía"}
          </code>
        </div>
      )}
    </div>
  );
};

const VOUCHER_NAMES: Record<string, string> = {
  "01": "Factura",
  "03": "Boleta",
  "07": "Nota de crédito",
};

const NubefactNumbering = () => {
  const { status, operate } = useWorkbench();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const highWater = status?.realHighWater ?? {};
  const codes = Array.from(new Set([...Object.keys(highWater), "03"])).sort();

  const set = async (voucherCode: string) => {
    const text = drafts[voucherCode] ?? "";
    if (text.trim() === "") return;
    const result = await operate("POST", "/workspace/remote-numbering", {
      voucherCode,
      last: Number(text),
    });
    if (!result.ok) return;
    setDrafts((current) => ({ ...current, [voucherCode]: "" }));
  };

  return (
    <div>
      <strong>Numeración en Nubefact</strong>
      {codes.map((code) => {
        const label = `${code} ${VOUCHER_NAMES[code] ?? ""}`.trim();
        return (
          <div className="wb-row" key={code}>
            <span>
              {label}: último <code>{highWater[code] ?? 0}</code>
            </span>
            <input
              type="number"
              min={0}
              aria-label={`Último número de ${label}`}
              value={drafts[code] ?? ""}
              onChange={(event) =>
                setDrafts((current) => ({
                  ...current,
                  [code]: event.target.value,
                }))
              }
            />
            <button
              type="button"
              aria-label={`Fijar ${label}`}
              onClick={() => set(code)}
              disabled={(drafts[code] ?? "") === ""}
            >
              Fijar
            </button>
          </div>
        );
      })}
      <div className="wb-hint">
        Ingresa el último número que Nubefact tiene para este tipo de documento
        y serie (el error 21 lo indica).
      </div>
    </div>
  );
};

export const ModeSection = () => {
  const { status, operate } = useWorkbench();
  const [selected, setSelected] = useState<NubefactMode | null>(null);
  const value = selected ?? status?.mode ?? "off";

  const apply = async () => {
    await operate("POST", "/workspace/mode", { mode: value }, true);
    setSelected(null);
  };

  return (
    <Section title="Modo Nubefact" defaultOpen>
      <div className="wb-row">
        <select
          aria-label="Modo Nubefact"
          value={value}
          onChange={(event) => setSelected(event.target.value as NubefactMode)}
        >
          <option value="off">Off</option>
          <option value="simulated">Simulado</option>
          <option
            value="real"
            disabled={!status?.realAvailable}
            title={status?.realUnavailableReason ?? undefined}
          >
            {status?.realAvailable ? "Real" : "Real (no disponible)"}
          </option>
        </select>
        <button
          type="button"
          onClick={apply}
          disabled={!status || value === status.mode}
        >
          Aplicar
        </button>
      </div>
      {status && (
        <div className={status.realAvailable ? "wb-hint" : "wb-warn"}>
          {status.realAvailable
            ? `Cuenta real: ${status.realAccount} (modo prueba, SUNAT apagado, correo al cliente apagado).`
            : (status.realUnavailableReason ?? "Real no está disponible.")}
        </div>
      )}
      <div className="wb-hint">
        Real crea registros en la cuenta de prueba de Nubefact; Reset no los
        borra.
      </div>
      {status?.mode === "simulated" && <SimulatedQueue />}
      {status?.mode === "real" && <NubefactNumbering />}
    </Section>
  );
};
