import { SRJ_WORKBENCH_DEV_ONLY } from "./marker";
import { panelStore, type WorkbenchPrefill } from "./panel-store";

const STYLE = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: 12,
  color: "#7cfc00",
  background: "rgba(6, 10, 6, 0.85)",
  border: "1px dashed #3d7a3d",
  borderRadius: 2,
  padding: "4px 8px",
  cursor: "pointer",
  maxWidth: "100%",
  whiteSpace: "normal",
  textAlign: "left",
} as const;

const LABELS: Record<WorkbenchPrefill["action"], string> = {
  "prepare-enrollment": "› WB: preparar matrícula para este alumno",
  "prepare-payments": "› WB: preparar pagos para esta matrícula",
};

/** Dev only: opens the workbench console with this record's form filled in. */
const ContextButton = (props: WorkbenchPrefill) => (
  <button
    type="button"
    data-srj-workbench={SRJ_WORKBENCH_DEV_ONLY}
    style={STYLE}
    title="Solo desarrollo: abre el Workbench con este formulario lleno"
    onClick={() => panelStore.openWith(props)}
  >
    {LABELS[props.action]}
  </button>
);

export default ContextButton;
