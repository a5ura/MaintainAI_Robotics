import type { Evidence } from "./model";

export function evidenceDescription(e: Evidence) {
  const extra = [
    e.vision
      ? `camera ${e.vision.status}, acquired ${e.vision.acquired_t}s, confidence ${e.vision.confidence ?? "unknown"}`
      : "",
    e.placement
      ? `observed placement ${e.placement.observed?.map((v) => v.toFixed(3)).join(", ") ?? "absent"} (${e.placement.source})`
      : "",
    e.controller ? `controller ${e.controller.state}` : "",
    ...(e.events ?? []).map(
      (event) => `${event.t}s ${event.code}: ${event.message}`,
    ),
  ]
    .filter(Boolean)
    .join(" · ");
  return `${e.phase} · grip ${e.grip_command ? "HOLD" : "RELEASE"} · object ${e.object_present === null ? "UNKNOWN" : e.object_present ? "PRESENT" : "ABSENT"} · vacuum ${e.pressure_kpa ?? "unknown"} kPa · verification ${e.verification ?? "not sampled"}${extra ? " · " + extra : ""}`;
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
  return (
    <div className="evidence-references">
      <span className="evidence-label">{label}</span>
      {ids.length === 0 ? (
        <span className="muted">None observed</span>
      ) : (
        ids.map((id) => {
          const row = timeline.find((e) => e.id === id);
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
