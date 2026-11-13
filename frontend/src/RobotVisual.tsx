import { BASE, LINKS, TOOL, trajectory, type Vec } from "./model";
import type { ComponentId } from "./engineering";
type SelectionProps = {
  selected?: ComponentId | null;
  onSelect?: (id: ComponentId) => void;
};
function Housing({
  radius,
  id,
  selected,
  onSelect,
}: { radius: number; id: ComponentId } & SelectionProps) {
  const color = selected === id ? "#9be7de" : "#344d5a";
  return (
    <group
      onClick={(e) => {
        if (onSelect) {
          e.stopPropagation();
          onSelect(id);
        }
      }}
    >
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, 0.32, 20]} />
        <meshStandardMaterial color={color} metalness={0.45} roughness={0.45} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[0, 0, side * 0.17]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[radius * 0.68, radius * 0.68, 0.025, 16]} />
          <meshStandardMaterial
            color="#9aadb4"
            metalness={0.65}
            roughness={0.35}
          />
        </mesh>
      ))}
    </group>
  );
}
function ArmSection({ length, height }: { length: number; height: number }) {
  return (
    <group>
      <mesh position={[length / 2, 0, 0]}>
        <boxGeometry args={[length, height, 0.27]} />
        <meshStandardMaterial
          color="#dec998"
          metalness={0.3}
          roughness={0.48}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[length / 2, 0, side * 0.14]}>
          <boxGeometry args={[length * 0.7, height * 0.35, 0.014]} />
          <meshStandardMaterial
            color="#657780"
            metalness={0.3}
            roughness={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}
export function BaseHousing({ selected, onSelect }: SelectionProps) {
  return (
    <group
      name="base-housing"
      onClick={(e) => {
        if (onSelect) {
          e.stopPropagation();
          onSelect("base");
        }
      }}
    >
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.53, 0.56, 0.09, 24]} />
        <meshStandardMaterial color="#283d49" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.34, 0.44, 0.32, 24]} />
        <meshStandardMaterial
          color={selected === "base" ? "#9be7de" : "#607785"}
          metalness={0.5}
          roughness={0.45}
        />
      </mesh>
      <mesh position={[0, 0.46, 0]}>
        <cylinderGeometry args={[0.33, 0.33, 0.1, 24]} />
        <meshStandardMaterial
          color="#263f4a"
          metalness={0.5}
          roughness={0.45}
        />
      </mesh>
    </group>
  );
}
// Keep the approved 3R hierarchy and named TCP pure for transform verification.
export function Robot({
  t,
  selected,
  onSelect,
}: { t: number } & SelectionProps) {
  const q = trajectory(t);
  return (
    <group name="joint-yaw" position={[0, BASE, 0]} rotation={[0, q[0], 0]}>
      <Housing
        radius={0.22}
        id="shoulder"
        selected={selected}
        onSelect={onSelect}
      />
      <group name="joint-shoulder" rotation={[0, 0, q[1]]}>
        <ArmSection length={LINKS[0]} height={0.24} />
        <group
          name="joint-elbow"
          position={[LINKS[0], 0, 0]}
          rotation={[0, 0, q[2]]}
        >
          <Housing
            radius={0.19}
            id="elbow"
            selected={selected}
            onSelect={onSelect}
          />
          <ArmSection length={LINKS[1]} height={0.18} />
          <group
            onClick={(e) => {
              if (onSelect) {
                e.stopPropagation();
                onSelect("tool");
              }
            }}
          >
            <mesh position={[LINKS[1], -0.1, 0]}>
              <cylinderGeometry args={[0.085, 0.085, 0.18, 16]} />
              <meshStandardMaterial
                color="#a3b8c0"
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
            <mesh position={[LINKS[1], -0.22, 0]}>
              <cylinderGeometry args={[0.09, 0.14, 0.07, 16]} />
              <meshStandardMaterial
                color="#65bdaf"
                metalness={0.15}
                roughness={0.65}
              />
            </mesh>
            <group name="tcp" position={[LINKS[1], -TOOL, 0]}>
              <mesh name="tcp-proxy">
                <torusGeometry args={[0.19, 0.009, 6, 24]} />
                <meshBasicMaterial
                  color={selected === "tool" ? "#b4ffff" : "#69a99f"}
                />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
