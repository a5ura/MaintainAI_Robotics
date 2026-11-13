import { scenarioObjectPosition, type Scenario } from "./scenarios";
import type { Vec } from "./model";
import { SOURCE, TARGET } from "./workcellView";
import { workcellState } from "./workcellState";
export function Workpiece({ t, scenario }: { t: number; scenario: Scenario }) {
  return (
    <group name="workpiece" position={scenarioObjectPosition(t, scenario)}>
      <mesh name="part-body">
        <boxGeometry args={[0.24, 0.24, 0.24]} />
        <meshStandardMaterial
          color={
            scenario === "drop" && t >= 6
              ? "#ff8c75"
              : scenario === "position" && t >= 10
                ? "#f0c474"
                : "#81e4cb"
          }
          metalness={0.15}
          roughness={0.48}
        />
      </mesh>
      <mesh position={[0, 0.122, 0]}>
        <boxGeometry args={[0.13, 0.004, 0.13]} />
        <meshStandardMaterial color="#e9f5ee" roughness={0.8} />
      </mesh>
    </group>
  );
}
export function WorkcellEnvironment() {
  return (
    <group>
      <mesh position={[1.1, -0.055, 0]}>
        <boxGeometry args={[4.5, 0.1, 4.7]} />
        <meshStandardMaterial color="#1c303e" roughness={0.95} />
      </mesh>
      <gridHelper
        args={[6, 12, "#365260", "#263e4c"]}
        position={[1.1, 0.001, 0]}
      />
      {[SOURCE, TARGET].map((p, i) => (
        <group key={i} name={i ? "destination-fixture" : "source-fixture"}>
          <mesh position={[p[0], p[1] - 0.15, p[2]]}>
            <boxGeometry args={[0.8, 0.06, 0.8]} />
            <meshStandardMaterial
              color={i ? "#3b706c" : "#657b8b"}
              metalness={0.3}
              roughness={0.6}
            />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[p[0] + side * 0.36, p[1] - 0.119, p[2]]}
            >
              <boxGeometry args={[0.02, 0.002, 0.72]} />
              <meshStandardMaterial
                color="#b8bdaa"
                metalness={0.4}
                roughness={0.55}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
function Marker({ point, color }: { point: Vec; color: string }) {
  return (
    <mesh position={point} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.25, 0.013, 6, 32]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}
export function FaultMarkers({
  t,
  scenario,
}: {
  t: number;
  scenario: Scenario;
}) {
  const state = workcellState(t, scenario);
  if (state.marker === "none") return null;
  const color =
    state.tone === "fault"
      ? "#ff937c"
      : state.tone === "warning"
        ? "#f1c16b"
        : "#9aecd1";
  return (
    <group name={`indicator-${state.marker}`}>
      <Marker
        point={[
          state.point[0],
          state.marker === "loss" ? 0.018 : state.point[1] - 0.105,
          state.point[2],
        ]}
        color={color}
      />
      {state.marker === "loss" && (
        <mesh position={state.point}>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}
      {state.observed && (
        <>
          <Marker
            point={[
              state.observed[0],
              state.observed[1] - 0.105,
              state.observed[2],
            ]}
            color={color}
          />
          <mesh
            name="placement-discrepancy"
            position={[
              (state.point[0] + state.observed[0]) / 2,
              0.025,
              state.point[2],
            ]}
          >
            <boxGeometry
              args={[
                Math.abs(state.observed[0] - state.point[0]),
                0.015,
                0.025,
              ]}
            />
            <meshBasicMaterial color={color} />
          </mesh>
        </>
      )}
    </group>
  );
}
