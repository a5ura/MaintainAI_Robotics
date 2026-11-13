import type { Evidence } from "./model";
import { useInvestigation } from "./evidenceSelection";
export const presenceText = (value: boolean | null | undefined) =>
  value === true ? "PRESENT" : value === false ? "ABSENT" : "UNKNOWN";
export const placementText = (placement: Evidence["placement"]) =>
  placement?.observed?.map((v) => v.toFixed(3)).join(", ") ??
  (placement?.object_present === false
    ? "explicitly absent"
    : "unknown / position unavailable");

export function evidenceDescription(e: Evidence) {
  const extra = [
    e.vision
      ? `camera ${e.vision.status}, acquired ${e.vision.acquired_t}s, confidence ${e.vision.confidence ?? "unknown"}`
      : "",
    e.placement
      ? `observed placement ${placementText(e.placement)} (${e.placement.source})`
      : "",
    e.controller ? `controller ${e.controller.state}` : "",
    ...(e.events ?? []).map(
      (event) => `${event.t}s ${event.code}: ${event.message}`,
    ),
  ]
    .filter(Boolean)
    .join(" · ");
  return `${e.phase} · grip ${e.grip_command ? "HOLD" : "RELEASE"} · Object at gripper ${presenceText(e.object_present)} · vacuum ${e.pressure_kpa ?? "unknown"} kPa · verification ${e.verification ?? "not sampled"}${extra ? " · " + extra : ""}`;
}

export function EvidenceReferences({
  ids,
  timeline,
  label,
}: {
  ids: string[];
  timeline: Evidence[];
  label: string;
}) {
  const investigation = useInvestigation();
  const active = investigation?.result?.timeline === timeline;
  return (
    <div className="evidence-references">
      <span className="evidence-label">{label}</span>
      {ids.length === 0 ? (
        <span className="muted">None observed</span>
      ) : (
        ids.map((id) => {
          const matches = timeline.filter((e) => e.id === id);
          const row = matches.length === 1 ? matches[0] : null;
          if (!row)
            return (
              <span key={id} className="fault">
                {id} · reference unavailable
              </span>
            );
          const description = evidenceDescription(row);
          return (
            <a
              key={id}
              href={`#evidence-${id}`}
              title={description}
              aria-current={
                active && investigation?.selectedId === id ? "true" : undefined
              }
              onClick={() => {
                if (active) investigation?.select(id);
              }}
              aria-label={`${label} ${id} at ${row.t.toFixed(1)} seconds: ${description}`}
            >
              {id}
              <span> · {row.t.toFixed(1)}s</span>
            </a>
          );
        })
      )}
    </div>
  );
}
