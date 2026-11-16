import { scenarioSample, type Scenario } from "./scenarios";
import { Canvas, useThree } from "@react-three/fiber";
import {
  Component,
  memo,
  type ReactNode,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three";
import {
  engineeringState,
  executedPath,
  NO_OVERLAYS,
  type Overlays,
  type ComponentId,
} from "./engineering";
import { type Vec, type Evidence } from "./model";
import EvidenceHighlight from "./EvidenceHighlight";
import { historicalPosition } from "./evidenceSelection";
import { Robot, BaseHousing } from "./RobotVisual";
import { Workpiece, WorkcellEnvironment, FaultMarkers } from "./WorkcellScene";
import {
  SOURCE,
  TARGET,
  viewCamera,
  cameraPose,
  type CameraView,
} from "./workcellView";
import { workcellState } from "./workcellState";
export { Robot } from "./RobotVisual";
const Environment = memo(WorkcellEnvironment);

function WorkcellCamera({
  view,
  revision,
  onContext,
}: {
  view: CameraView;
  revision: number;
  onContext: (lost: boolean) => void;
}) {
  const { camera, size, invalidate, gl } = useThree();
  useLayoutEffect(() => {
    const pose = cameraPose(view, size.width / size.height);
    camera.position.set(...pose.position);
    camera.lookAt(...pose.target);
    if ("fov" in camera) camera.fov = pose.fov;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    invalidate();
  }, [camera, view, revision, size.width, size.height, invalidate]);
  useEffect(() => {
    const element = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onContext(true);
    };
    const restored = () => {
      onContext(false);
      invalidate();
    };
    element.addEventListener("webglcontextlost", lost);
    element.addEventListener("webglcontextrestored", restored);
    return () => {
      element.removeEventListener("webglcontextlost", lost);
      element.removeEventListener("webglcontextrestored", restored);
    };
  }, [gl, invalidate, onContext]);
  return null;
}
// The pinned Canvas configures its renderer asynchronously. Probe once per mount
// so an unsupported browser gets text fallback without an unhandled configure error.
function webGLAvailable() {
  if (typeof document === "undefined") return false;
  try {
    const probe = document.createElement("canvas").getContext("webgl2");
    if (!probe) return false;
    probe.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
export function TCPPath({ t }: { t: number }) {
  const geometry = useMemo(() => {
    const points = executedPath(t),
      vertices: number[] = [];
    for (let i = 1; i < points.length; i++)
      vertices.push(...points[i - 1], ...points[i]);
    return new BufferGeometry().setAttribute(
      "position",
      new Float32BufferAttribute(vertices, 3),
    );
  }, [t]);
  // R3F disposes replaced declarative geometries; explicitly dispose this memoized resource.
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineSegments name="executed-tcp-path" geometry={geometry}>
      <lineBasicMaterial color="#8be0ce" />
    </lineSegments>
  );
}
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="canvas-error">
        3D rendering unavailable. Enable WebGL to view the workcell. Simulation
        and evidence controls remain available.
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function Workcell({
  t,
  drop = false,
  scenario,
  engineering = false,
  overlays = NO_OVERLAYS,
  selected = null,
  onSelect,
  historicalEvidence = null,
}: {
  historicalEvidence?: Evidence | null;
  t: number;
  drop?: boolean;
  scenario?: Scenario;
  engineering?: boolean;
  overlays?: Overlays;
  selected?: ComponentId | null;
  onSelect?: (id: ComponentId) => void;
}) {
  const outcome = scenario ?? (drop ? "drop" : "normal");
  const [view, setView] = useState<CameraView>("overview"),
    [revision, setRevision] = useState(0);
  const [available] = useState(webGLAvailable),
    [lost, setLost] = useState(false),
    [canvasKey, setCanvasKey] = useState(0);
  const stage = useRef<HTMLDivElement>(null),
    [size, setSize] = useState({ width: 800, height: 348 });
  useLayoutEffect(() => {
    const element = stage.current;
    if (!element) return;
    const update = () => {
      const box = element.getBoundingClientRect();
      if (box.width && box.height)
        setSize((previous) =>
          previous.width === box.width && previous.height === box.height
            ? previous
            : { width: box.width, height: box.height },
        );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const projection = useMemo(
    () => viewCamera(view, size.width / size.height),
    [view, size.width, size.height],
  );
  const state = workcellState(t, outcome);
  function label(point: Vec) {
    const p = new Vector3(...point).project(projection);
    return {
      left: `${Math.max(15, Math.min(85, (p.x + 1) * 50))}%`,
      top: `${Math.max(27, Math.min(82, (1 - p.y) * 50))}%`,
    };
  }
  const legacy =
    state.headline ??
    (state.marker === "stop"
      ? "PROTECTIVE STOP · CYCLE INTERRUPTED"
      : state.marker === "vision"
        ? "CAMERA TIMEOUT · VERIFICATION UNAVAILABLE"
        : state.marker === "offset"
          ? "PLACEMENT OFFSET · INDEPENDENT OBSERVATION"
          : null);
  return (
    <div
      className="workcell-stage"
      data-testid="workcell-stage"
      data-view={view}
      tabIndex={-1}
    >
      <div className="scene-render" ref={stage}>
        <div
          className="camera-toolbar"
          role="group"
          aria-label="Workcell camera"
        >
          <button
            aria-pressed={view === "overview"}
            onClick={() => setView("overview")}
          >
            Overview
          </button>
          <button
            aria-pressed={view === "inspection"}
            onClick={() => setView("inspection")}
          >
            Inspection
          </button>
          <button
            onClick={() => {
              setView("overview");
              setRevision((n) => n + 1);
            }}
          >
            Reset View
          </button>
        </div>
        {available ? (
          <Boundary>
            <Canvas
              key={canvasKey}
              camera={{ position: [5, 4.2, 6], fov: 38, near: 0.1, far: 60 }}
              dpr={[1, 1.5]}
              shadows={false}
              frameloop="demand"
            >
              <WorkcellCamera
                view={view}
                revision={revision}
                onContext={setLost}
              />
              <color attach="background" args={["#101e29"]} />
              <hemisphereLight args={["#daeaf2", "#283e4a", 1.8]} />
              <directionalLight position={[3, 6, 4]} intensity={2.6} />
              <Environment />
              <BaseHousing
                selected={engineering ? selected : null}
                onSelect={engineering ? onSelect : undefined}
              />
              <Robot
                t={t}
                selected={engineering ? selected : null}
                onSelect={engineering ? onSelect : undefined}
              />
              <Workpiece t={t} scenario={outcome} />
              <FaultMarkers t={t} scenario={outcome} />
              <EvidenceHighlight row={historicalEvidence} />
              {engineering &&
                overlays.frames &&
                engineeringState(t).frames.map((f) => (
                  <group
                    key={f.name}
                    name={`frame-${f.name}`}
                    position={f.position}
                    rotation={[0, f.yaw, 0]}
                  >
                    <group rotation={[0, 0, f.pitch]}>
                      <axesHelper args={[0.35]} />
                    </group>
                  </group>
                ))}
              {engineering && overlays.path && <TCPPath t={t} />}
            </Canvas>
          </Boundary>
        ) : (
          <div className="canvas-error" role="status">
            3D rendering unavailable. Simulation and evidence controls remain
            available.
          </div>
        )}
        {available && !lost && (
          <>
            <span className="fixture-label" style={label(SOURCE)}>
              SOURCE
            </span>
            <span
              className="fixture-label destination-label"
              style={label(TARGET)}
            >
              DESTINATION
            </span>
          </>
        )}
      </div>
      {historicalEvidence && (
        <div
          className="historical-badge"
          data-testid="historical-marker"
          data-position={
            historicalPosition(historicalEvidence)?.join(",") ?? "unavailable"
          }
        >
          Historical {historicalEvidence.id} ·{" "}
          {Number.isFinite(historicalEvidence.t)
            ? `${historicalEvidence.t.toFixed(1)}s`
            : "time unavailable"}
          <small>
            {historicalPosition(historicalEvidence) && available && !lost
              ? "Recorded TCP · live robot unchanged"
              : "Spatial highlighting unavailable · inspect recorded text"}
          </small>
        </div>
      )}
      <div
        className={`scene-status tone-${state.tone}`}
        data-testid="scene-status"
        role={legacy ? "status" : undefined}
      >
        <span>SIMULATED OBSERVATIONS</span>
        <strong>{legacy ?? state.text}</strong>
        {legacy && <p>{state.text}</p>}
        <small>{state.note}</small>
      </div>
      {lost && (
        <div className="context-fallback" role="status">
          <p>3D context lost. Simulation and evidence remain available.</p>
          <button
            onClick={() => {
              setLost(false);
              setCanvasKey((n) => n + 1);
            }}
          >
            Reload 3D view
          </button>
        </div>
      )}
    </div>
  );
}
