import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
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
  const [context, setContext] = useState(() => ({
    result,
    scope,
    epoch: 0,
    selectedId: null as string | null,
  }));
  // React's guarded state adjustment rerenders before committing changed props.
  // Unlike an identity-only ref guard, the epoch never returns to an old activation.
  if (context.result !== result || context.scope !== scope)
    setContext({ result, scope, epoch: context.epoch + 1, selectedId: null });
  const epoch = context.epoch;
  const latest = useRef<{
    result: Diagnosis | null;
    scope: string;
    epoch: number;
  } | null>(null);
  useLayoutEffect(() => {
    const active = { result, scope, epoch };
    latest.current = active;
    return () => {
      if (latest.current === active) latest.current = null;
    };
  }, [result, scope, epoch]);
  const select = useCallback(
    (id: string) => {
      const active = latest.current;
      if (
        !result ||
        active?.epoch !== epoch ||
        active.result !== result ||
        active.scope !== scope
      )
        return;
      setContext((current) =>
        current.epoch === epoch &&
        current.result === result &&
        current.scope === scope &&
        current.selectedId !== id
          ? { ...current, selectedId: id }
          : current,
      );
    },
    [result, scope, epoch],
  );
  const clear = useCallback(() => {
    if (latest.current?.epoch !== epoch) return;
    setContext((current) =>
      current.epoch === epoch && current.selectedId !== null
        ? { ...current, selectedId: null }
        : current,
    );
  }, [epoch]);
  const selectedId =
    context.result === result && context.scope === scope
      ? context.selectedId
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
