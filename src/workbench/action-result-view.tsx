import type { WorkbenchResponse } from "./client";
import { useWorkbench } from "./workbench-context";
import type { ActionResult, CreatedRecord } from "./types";

const SIMULATED_LINK = /^https?:\/\/simulated\.invalid(\/|$)/;

const RecordLink = ({
  base,
  path,
  label,
}: {
  base: string;
  path: string | null;
  label: string;
}) => {
  if (!path) return null;
  const href = base + path;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={
        SIMULATED_LINK.test(href)
          ? "Enlace simulado: no existe ningún documento real"
          : undefined
      }
    >
      {label}
    </a>
  );
};

const CreatedTable = ({
  created,
  committed,
}: {
  created: CreatedRecord[];
  committed: boolean;
}) => {
  const { status } = useWorkbench();
  return (
    <div className="wb-tablewrap">
      <div>{committed ? "Creado" : "Se crearía"}</div>
      <table className="wb-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>{committed ? "Id" : "Id (se asigna al ejecutar)"}</th>
            <th>Etiqueta</th>
            {committed && <th>Enlaces</th>}
          </tr>
        </thead>
        <tbody>
          {created.map((record, index) => (
            <tr key={`${record.kind}-${record.id}-${index}`}>
              <td>{record.kind}</td>
              <td>
                {committed ? (
                  record.id
                ) : (
                  <span
                    className="wb-hint"
                    title="Provisional: la previsualización se deshace y el id real se asigna al ejecutar."
                  >
                    provisional ({record.id})
                  </span>
                )}
              </td>
              <td className="wb-wrap">{record.label}</td>
              {committed && (
                <td>
                  <RecordLink
                    base={status?.frontendUrl ?? ""}
                    path={record.frontendLink}
                    label="abrir"
                  />{" "}
                  <RecordLink
                    base={status?.backendUrl ?? ""}
                    path={record.apiLink}
                    label="api"
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/** What a preview or an execute answered, refusals word for word. */
export const ActionResultView = ({
  response,
  committed,
}: {
  response: WorkbenchResponse<ActionResult>;
  committed: boolean;
}) => {
  if (!response.ok)
    return <div className="wb-msg wb-bad">{response.message}</div>;
  const result = response.data;
  return (
    <div role="status">
      {result.ok ? (
        <div className="wb-ok">
          {committed
            ? "Guardado: estos registros ya existen."
            : "Previsualización: no se guardó nada. Los ids son provisionales."}
        </div>
      ) : (
        <div className="wb-msg wb-bad">{result.refusal}</div>
      )}
      {result.steps?.length > 0 && (
        <>
          <div>Pasos</div>
          <ol>
            {result.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </>
      )}
      {result.created?.length > 0 && (
        <CreatedTable created={result.created} committed={committed} />
      )}
    </div>
  );
};
