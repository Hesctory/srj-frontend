import { useEffect, useState } from "react";
import { workbench } from "./client";
import { useConfirm } from "./confirm-dialog";
import { localTime, MODE_LABELS, utcLabel } from "./format";
import { Section } from "./section";
import { useWorkbench } from "./workbench-context";
import type { RestorePreview, SnapshotRecord } from "./types";

const RestoreSummary = ({ preview }: { preview: RestorePreview }) => {
  const lost = preview.actionsThatWillBeLost ?? [];
  return (
    <div>
      <p>
        <b>¿Restaurar «{preview.name}»?</b>
      </p>
      <p>
        La fecha de negocio vuelve a {preview.snapshotBusinessDate}; el modo
        Nubefact pasa a{" "}
        {MODE_LABELS[preview.snapshotMode] ?? preview.snapshotMode}. El backend
        se reinicia.
      </p>
      <p>Se perderán {lost.length} acción(es) hechas desde este snapshot:</p>
      {lost.length > 0 && (
        <ul>
          {lost.map((entry, index) => (
            <li key={index} title={`${utcLabel(entry.timeUtc)} UTC`}>
              {localTime(entry.timeUtc)} — {entry.name}
              {entry.message ? `: ${entry.message}` : ""}
            </li>
          ))}
        </ul>
      )}
      {preview.warnings?.map((warning, index) => (
        <p key={index} className="wb-warn">
          {warning}
        </p>
      ))}
    </div>
  );
};

export const WorkspaceSection = () => {
  const { status, generation, operate, track, showRefusal, clearMessages } =
    useWorkbench();
  const confirm = useConfirm();
  const [snapshots, setSnapshots] = useState<SnapshotRecord[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    let current = true;
    void workbench.get<SnapshotRecord[]>("/workspace/snapshots").then((res) => {
      if (!current) return;
      setSnapshots(res.ok ? res.data : null);
      setLoadError(res.ok ? null : res.message);
    });
    return () => {
      current = false;
    };
  }, [generation]);

  const reset = async () => {
    const real = status?.realSendsEver || status?.history === "real";
    const ok = await confirm(
      <div>
        <p>
          <b>¿Reiniciar el workspace?</b>
        </p>
        <p>
          Se descartan todos los registros generados, el estado y el libro
          simulado, y se construye un workspace nuevo. El backend se reinicia.
        </p>
        {real && (
          <p className="wb-warn">
            Alguna vez se enviaron documentos a la cuenta de prueba real de
            Nubefact. Reset no los borra allí; la numeración continúa por
            encima.
          </p>
        )}
      </div>,
      "Reset",
    );
    if (ok) await operate("POST", "/workspace/reset", undefined, true);
  };

  const take = async () => {
    if (!name.trim()) return showRefusal("Ponle un nombre al snapshot.");
    const res = await operate("POST", "/workspace/snapshots", {
      name: name.trim(),
    });
    if (res.ok) setName("");
  };

  const restore = async (id: string) => {
    clearMessages();
    const preview = await track(() =>
      workbench.get<RestorePreview>(
        `/workspace/snapshots/${encodeURIComponent(id)}/restore-preview`,
      ),
    );
    if (!preview.ok) return showRefusal(preview.message);
    if (await confirm(<RestoreSummary preview={preview.data} />, "Restaurar"))
      await operate(
        "POST",
        `/workspace/snapshots/${encodeURIComponent(id)}/restore`,
        undefined,
        true,
      );
  };

  const remove = async (snapshot: SnapshotRecord) => {
    if (
      await confirm(
        <p>
          ¿Borrar el snapshot «{snapshot.name}»? Su base de datos se elimina.
        </p>,
        "Borrar",
      )
    )
      await operate(
        "DELETE",
        `/workspace/snapshots/${encodeURIComponent(snapshot.id)}`,
      );
  };

  return (
    <Section title="Workspace y snapshots">
      <div className="wb-row">
        <input
          type="text"
          aria-label="Nombre del snapshot"
          placeholder="nombre del snapshot"
          maxLength={60}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button type="button" onClick={take}>
          Tomar snapshot
        </button>
      </div>
      {status && (
        <div className="wb-hint">
          {status.snapshotCount} de {status.snapshotCap} snapshots usados.
        </div>
      )}
      <div className="wb-tablewrap">
        <table className="wb-table wb-stack">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Creado (UTC)</th>
              <th>Fecha</th>
              <th>Modo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {snapshots === null ? (
              <tr>
                <td colSpan={5} className={loadError ? "wb-bad" : "wb-hint"}>
                  {loadError ?? "cargando…"}
                </td>
              </tr>
            ) : snapshots.length === 0 ? (
              <tr>
                <td colSpan={5} className="wb-hint">
                  Aún no hay snapshots.
                </td>
              </tr>
            ) : (
              snapshots.map((snapshot) => (
                <tr key={snapshot.id}>
                  <td className="wb-wrap">{snapshot.name}</td>
                  <td>{utcLabel(snapshot.createdUtc)}</td>
                  <td>{snapshot.businessDate}</td>
                  <td>
                    {MODE_LABELS[snapshot.state.mode] ?? snapshot.state.mode}
                  </td>
                  <td>
                    <div className="wb-row" style={{ margin: 0 }}>
                      <button
                        type="button"
                        onClick={() => restore(snapshot.id)}
                      >
                        Restaurar
                      </button>
                      <button
                        type="button"
                        className="wb-danger"
                        onClick={() => remove(snapshot)}
                      >
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div
        className="wb-row"
        style={{ borderTop: "1px dashed #2f6b2f", paddingTop: 6 }}
      >
        <button type="button" className="wb-danger" onClick={reset}>
          Reset
        </button>
        <span className="wb-hint">
          Descarta todo el workspace y reinicia el backend.
        </span>
      </div>
    </Section>
  );
};
