import { Fragment, useCallback, useEffect, useState } from "react";
import { workbench } from "./client";
import {
  localTime,
  LOG_KIND_LABELS,
  LOG_RESULT_LABELS,
  utcLabel,
} from "./format";
import { Section } from "./section";
import { useWorkbench } from "./workbench-context";
import type { LogEntry } from "./types";

const SHOWN = 50;

export const LogSection = () => {
  const { generation, track } = useWorkbench();
  const [entries, setEntries] = useState<LogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exported, setExported] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await workbench.get<LogEntry[]>("/log");
    if (res.ok) {
      setEntries(res.data.slice(-SHOWN).reverse());
      setError(null);
    } else setError(res.message);
  }, []);

  useEffect(() => {
    void load();
  }, [load, generation]);

  const exportLog = async () => {
    const res = await track(() =>
      workbench.post<{ path: string }>("/log/export"),
    );
    setExported(res.ok ? `Exportado a ${res.data.path}` : res.message);
  };

  return (
    <Section title="Registro">
      <div className="wb-row">
        <button type="button" onClick={() => void load()}>
          Actualizar
        </button>
        <button type="button" onClick={exportLog}>
          Exportar
        </button>
        {exported && <span className="wb-hint">{exported}</span>}
      </div>
      {error && <div className="wb-msg wb-bad">{error}</div>}
      <div className="wb-tablewrap">
        <table className="wb-table wb-stack">
          <thead>
            <tr>
              <th title="Hora local; pasa el puntero para ver UTC">Hora</th>
              <th>Tipo</th>
              <th>Nombre</th>
              <th>Resultado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {entries?.length === 0 && (
              <tr>
                <td colSpan={5} className="wb-hint">
                  Nada registrado aún.
                </td>
              </tr>
            )}
            {/* The message gets its own full-width line under each entry:
                squeezed into a column it made every row several lines tall. */}
            {entries?.map((entry, index) => (
              <Fragment key={`${entry.timeUtc}-${index}`}>
                <tr className={entry.message ? "wb-log-head" : undefined}>
                  <td title={`${utcLabel(entry.timeUtc)} UTC`}>
                    {localTime(entry.timeUtc)}
                  </td>
                  <td>{LOG_KIND_LABELS[entry.kind] ?? entry.kind}</td>
                  <td className="wb-wrap">{entry.name}</td>
                  <td className={entry.result === "ok" ? "wb-ok" : "wb-bad"}>
                    {LOG_RESULT_LABELS[entry.result] ?? entry.result}
                  </td>
                  <td>{entry.businessDate}</td>
                </tr>
                {entry.message && (
                  <tr>
                    <td colSpan={5} className="wb-hint">
                      {entry.message}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
};
