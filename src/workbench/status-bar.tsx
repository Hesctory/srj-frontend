import { HISTORY_LABELS, humanBytes, MODE_LABELS } from "./format";
import { useWorkbench } from "./workbench-context";

export const StatusBar = () => {
  const { status, statusError, restarting, refreshStatus } = useWorkbench();
  const backend = !status
    ? null
    : restarting
      ? { text: "reiniciando…", className: "wb-warn" }
      : !status.workspaceExists
        ? { text: "sin workspace (Reset para crearlo)", className: "wb-bad" }
        : status.backendRunning
          ? { text: "en marcha", className: "wb-ok" }
          : { text: "detenido", className: "wb-bad" };
  return (
    <div className="wb-status" aria-label="Estado del workspace">
      {status ? (
        <>
          <span>
            <span className="wb-k">fecha</span>
            {status.businessDate}{" "}
            <span className="wb-hint">
              ({status.followingToday ? "sigue a hoy" : "fijada"})
            </span>
          </span>
          <span>
            <span className="wb-k">nubefact</span>
            {MODE_LABELS[status.mode] ?? status.mode}
          </span>
          <span>
            <span className="wb-k">historial</span>
            {HISTORY_LABELS[status.history] ?? status.history}
          </span>
          <span>
            <span className="wb-k">backend</span>
            <span className={backend?.className}>{backend?.text}</span>
          </span>
          <span>
            <span className="wb-k">snapshots</span>
            {status.snapshotCount}/{status.snapshotCap} ·{" "}
            {humanBytes(status.snapshotBytes)}
          </span>
          <span>
            <span className="wb-k">creado</span>
            {status.counts.students} alumnos, {status.counts.relatives}{" "}
            familiares, {status.counts.enrollments} matrículas,{" "}
            {status.counts.payments} pagos, {status.counts.documents}{" "}
            comprobantes
          </span>
        </>
      ) : (
        !statusError && <span className="wb-hint">cargando estado…</span>
      )}
      {statusError && <span className="wb-bad">{statusError}</span>}
      <button
        type="button"
        onClick={() => void refreshStatus()}
        aria-label="Actualizar estado"
        title="Actualizar estado"
      >
        ↻
      </button>
    </div>
  );
};

/** The last operation's answer, word for word, and the restart banner. */
export const ConsoleMessages = () => {
  const { refusal, notice, restarting, optionsError } = useWorkbench();
  return (
    <>
      {restarting && (
        <div className="wb-msg wb-warn" role="status">
          Reiniciando el backend… Las peticiones de la app fallan unos segundos
          mientras tanto; es lo esperado.
        </div>
      )}
      {optionsError && (
        <div className="wb-msg wb-bad">
          No se pudieron cargar las opciones de los formularios: {optionsError}
        </div>
      )}
      {refusal && (
        <div className="wb-msg wb-bad" role="alert">
          {refusal}
        </div>
      )}
      {notice && (
        <div className="wb-msg wb-ok" role="status">
          {notice.message}
          {notice.warnings.map((warning, index) => (
            <div key={index} className="wb-warn">
              {warning}
            </div>
          ))}
        </div>
      )}
    </>
  );
};
