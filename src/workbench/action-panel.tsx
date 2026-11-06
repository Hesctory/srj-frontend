import { useState } from "react";
import { workbench, type WorkbenchResponse } from "./client";
import {
  executeState,
  expectationOf,
  signatureOf,
  stampFor,
  STALE_MESSAGE,
  type PreviewStamp,
} from "./preview-gate";
import { ActionResultView } from "./action-result-view";
import { useWorkbench } from "./workbench-context";
import type { ActionName, ActionResult } from "./types";

export const INPUTS_CHANGED_MESSAGE =
  "Los datos cambiaron — vuelve a previsualizar.";

/** What a form built from its fields: the request body, or why it can't yet. */
export type BuiltInputs = { body: object } | { error: string };

interface Shown {
  response: WorkbenchResponse<ActionResult>;
  committed: boolean;
  signature: string;
}

interface ActionPanelProps {
  name: ActionName;
  built: BuiltInputs;
  /** The form is still loading what it needs (the payments form's charges). */
  previewBlocked?: boolean;
  /** Said under the buttons while Preview is blocked. */
  previewBlockedReason?: string;
}

/**
 * Preview, then Execute. Execute is enabled only for the exact inputs that
 * were previewed, in the business date and mode of that preview, and turns
 * itself off once it succeeds.
 */
export const ActionPanel = ({
  name,
  built,
  previewBlocked = false,
  previewBlockedReason,
}: ActionPanelProps) => {
  const { context, track, afterExecute } = useWorkbench();
  const [stamp, setStamp] = useState<PreviewStamp | null>(null);
  const [shown, setShown] = useState<Shown | null>(null);
  const [attemptError, setAttemptError] = useState<string | null>(null);

  const body = "body" in built ? built.body : null;
  const signature = body ? signatureOf(body) : "";
  const state = executeState(stamp, body, context);

  const preview = async () => {
    if (!body) {
      setAttemptError("error" in built ? built.error : null);
      return;
    }
    setAttemptError(null);
    const response = await track(() =>
      workbench.post<ActionResult>(`/actions/${name}/preview`, body),
    );
    setStamp(response.ok && response.data.ok ? stampFor(body, context) : null);
    setShown({ response, committed: false, signature });
  };

  const execute = async () => {
    if (!body || !stamp || !state.enabled) return;
    // Only Execute carries `expect`: the server refuses it (409) when the
    // date or mode moved since the preview. The client-side gate stays.
    const response = await track(() =>
      workbench.post<ActionResult>(`/actions/${name}/execute`, {
        ...body,
        expect: expectationOf(stamp),
      }),
    );
    setStamp(null);
    setShown({ response, committed: true, signature });
    await afterExecute();
  };

  // An executed result describes records that now exist; once the inputs
  // change it no longer describes this form, so it goes.
  const visible =
    shown && !(shown.committed && shown.signature !== signature) ? shown : null;
  // A preview of other inputs stays visible, dimmed, with the reason Execute
  // is off.
  const outdated = !!visible && visible.signature !== signature;
  // A "fill this in first" message describes the inputs at click time; it
  // goes once they change.
  const currentError = "error" in built ? built.error : null;

  return (
    <div>
      <div className="wb-row">
        <button type="button" onClick={preview} disabled={previewBlocked}>
          Previsualizar
        </button>
        <button
          type="button"
          className="wb-primary"
          onClick={execute}
          disabled={!state.enabled}
        >
          Ejecutar
        </button>
      </div>
      {previewBlocked && previewBlockedReason && (
        <div className="wb-hint">{previewBlockedReason}</div>
      )}
      {attemptError && attemptError === currentError && (
        <div className="wb-msg wb-bad">{attemptError}</div>
      )}
      {!state.enabled && state.reason === "stale" && (
        <div className="wb-msg wb-warn">{STALE_MESSAGE}</div>
      )}
      {outdated && !(!state.enabled && state.reason === "stale") && (
        <div className="wb-msg wb-warn">{INPUTS_CHANGED_MESSAGE}</div>
      )}
      {visible && (
        <div className={outdated ? "wb-stale" : undefined}>
          <ActionResultView
            response={visible.response}
            committed={visible.committed}
          />
        </div>
      )}
    </div>
  );
};
