import { scenarioObjectPosition, type Scenario } from "./scenarios";
import { Canvas } from "@react-three/fiber";
import { Component, type ReactNode } from "react";
import {
  BASE,
  LINKS,
  TOOL,
  fk,
  trajectory,
  objectPosition,
  type Vec,
} from "./model";
function Joint({ position }: { position: Vec }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.16, 16, 12]} />
      <meshStandardMaterial color="#192b37" metalness={0.5} roughness={0.4} />
    </mesh>
  );
}
export function Robot({ t }: { t: number }) {
  const q = trajectory(t);
  return (
    <group position={[0, BASE, 0]} rotation={[0, q[0], 0]}>
      <Joint position={[0, 0, 0]} />
      <group rotation={[0, 0, q[1]]}>
        <mesh position={[LINKS[0] / 2, 0, 0]}>
          <boxGeometry args={[LINKS[0], 0.22, 0.25]} />
          <meshStandardMaterial
            color="#eab15a"
            metalness={0.35}
            roughness={0.4}
          />
        </mesh>
        <group position={[LINKS[0], 0, 0]} rotation={[0, 0, q[2]]}>
          <Joint position={[0, 0, 0]} />
          <mesh position={[LINKS[1] / 2, 0, 0]}>
            <boxGeometry args={[LINKS[1], 0.17, 0.2]} />
            <meshStandardMaterial color="#eab15a" />
          </mesh>
          <group name="tcp" position={[LINKS[1], -TOOL, 0]}>
            <Joint position={[0, 0, 0]} />
          </group>
          <mesh position={[LINKS[1], -0.13, 0]}>
            <cylinderGeometry args={[0.12, 0.17, 0.15, 16]} />
            <meshStandardMaterial color="#57d7c1" />
          </mesh>
        </group>
      </group>
    </group>
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
}: {
  t: number;
  drop?: boolean;
  scenario?: Scenario;
}) {
  const outcome = scenario ?? (drop ? "drop" : "normal");
  const source = fk(trajectory(2)).tcp,
    target = fk(trajectory(10)).tcp;
  return (
    <Boundary>
      <Canvas
        camera={{ position: [5, 4.2, 6], fov: 43 }}
        dpr={[1, 1.5]}
        shadows={false}
        onCreated={({ camera }) => camera.lookAt(0.9, 0.5, 0)}
      >
        <color attach="background" args={["#111e28"]} />
        <ambientLight intensity={1.8} />
        <directionalLight position={[3, 6, 4]} intensity={3} />
        <gridHelper args={[10, 20, "#34505c", "#22333f"]} />
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.4, 0.5, 0.48, 32]} />
          <meshStandardMaterial color="#293d4b" />
        </mesh>
        {[source, target].map((p, i) => (
          <mesh key={i} position={[p[0], p[1] - 0.15, p[2]]}>
            <boxGeometry args={[0.8, 0.06, 0.8]} />
            <meshStandardMaterial color={i ? "#24564f" : "#39485a"} />
          </mesh>
        ))}
        <Robot t={t} />
        <mesh position={scenarioObjectPosition(t, outcome)}>
          <boxGeometry args={[0.24, 0.24, 0.24]} />
          <meshStandardMaterial
            color={
              outcome === "drop" && t >= 6
                ? "#ff766b"
                : outcome === "position" && t >= 10
                  ? "#eab15a"
                  : "#8be0ce"
            }
          />
        </mesh>
      </Canvas>
    </Boundary>
  );
}
