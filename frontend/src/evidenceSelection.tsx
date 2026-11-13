import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Diagnosis, Evidence, Vec } from "./model";

export function resolveEvidence(result: Diagnosis | null, id: string | null) {
  if (!result || !id)
    return {
      row: null,
      issue: "Select a recorded reading to inspect its evidence.",
    };
  const matches = result.timeline.filter((row) => row.id === id);
  return matches.length === 1
    ? { row: matches[0], issue: "" }
    : {
        row: null,
        issue: `${id} · reference unavailable or ambiguous in this diagnosis.`,
      };
}
const vector = (value: unknown): value is Vec =>
  Array.isArray(value) &&
  value.length === 3 &&
  [0, 1, 2].every((i) => Number.isFinite(value[i]));
// The backend validity flag is required; no reconstruction from the live scenario.
export function historicalPosition(row: Evidence | null): Vec | null {
  const check = row?.kinematics;
  if (
    !row ||
    !Number.isFinite(row.t) ||
    row.t < 0 ||
    !vector(row.tcp) ||
    !vector(row.joints) ||
    check?.valid !== true ||
    !vector(check.expected_tcp) ||
    !Number.isFinite(check.error_m) ||
    check.error_m === null ||
    check.error_m < 0 ||
    !Number.isFinite(check.tolerance_m) ||
    check.tolerance_m < 0 ||
    check.error_m > check.tolerance_m
  )
    return null;
  // Validate the recorded metadata against itself using its supplied tolerance;
  // never infer a location from today's live robot pose or scenario.
  return Math.hypot(
    ...row.tcp.map((value, i) => value - check.expected_tcp![i]),
  ) <= check.tolerance_m
    ? row.tcp
    : null;
}
export function useEvidenceSelection(result: Diagnosis | null, scope: string) {
  const [selection, setSelection] = useState<{
    result: Diagnosis;
    scope: string;
    id: string;
  } | null>(null);
  const latest = useRef({ result, scope });
  latest.current = { result, scope };
  useEffect(() => setSelection(null), [result, scope]);
  const select = useCallback(
    (id: string) => {
      if (
        !result ||
        latest.current.result !== result ||
        latest.current.scope !== scope
      )
        return;
      setSelection({ result, scope, id });
    },
    [result, scope],
  );
  const clear = useCallback(() => setSelection(null), []);
  const selectedId =
    selection?.result === result && selection.scope === scope
      ? selection.id
      : null;
  return {
    result,
    selectedId,
    ...resolveEvidence(result, selectedId),
    select,
    clear,
  };
}
export type EvidenceSelection = ReturnType<typeof useEvidenceSelection>;
export const EvidenceSelectionContext = createContext<EvidenceSelection | null>(
  null,
);
export const useInvestigation = () => useContext(EvidenceSelectionContext);
