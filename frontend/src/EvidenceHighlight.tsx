import type { Evidence } from "./model";
import { historicalPosition } from "./evidenceSelection";
export default function EvidenceHighlight({ row }: { row: Evidence | null }) {
  const position = historicalPosition(row);
  if (!position) return null;
  return (
    <group name="historical-evidence" position={position}>
      <mesh>
        <octahedronGeometry args={[0.13, 0]} />
        <meshBasicMaterial color="#c9b5ff" wireframe />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.009, 6, 24]} />
        <meshBasicMaterial color="#c9b5ff" />
      </mesh>
    </group>
  );
}
