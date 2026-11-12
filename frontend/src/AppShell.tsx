import type { ReactNode } from "react";

export default function AppShell({
  view,
  onOperations,
  onDiagnostics,
  onMaintenance,
  children,
}: {
  view: "operations" | "maintenance";
  onOperations: () => void;
  onDiagnostics: () => void;
  onMaintenance: () => void;
  children: ReactNode;
}) {
  return (
    <div className="shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="app-header">
        <a className="brand" href="#">
          M<span> / </span>MaintainAI <b>ROBOTICS</b>
          <small>Cell 01 / R-01</small>
        </a>
        <nav className="workspace-nav" aria-label="Workspace">
          <button aria-pressed={view === "operations"} onClick={onOperations}>
            Operations
          </button>
          <button onClick={onDiagnostics}>Diagnostics</button>
          <button aria-pressed={view === "maintenance"} onClick={onMaintenance}>
            Maintenance
          </button>
        </nav>
        <span className="environment">
          SIMULATION<span>Not live hardware</span>
        </span>
      </header>
      {children}
    </div>
  );
}
