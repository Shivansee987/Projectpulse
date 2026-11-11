import ReactFlow from "reactflow";
import "reactflow/dist/style.css";

const nodes = [
  {
    id: "1",
    position: { x: 50, y: 100 },
    data: { label: "Requirements" },
  },
  {
    id: "2",
    position: { x: 300, y: 100 },
    data: { label: "Design" },
  },
  {
    id: "3",
    position: { x: 550, y: 100 },
    data: { label: "Development" },
  },
  {
    id: "4",
    position: { x: 800, y: 100 },
    data: { label: "Testing" },
  },
];

const edges = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
  },
  {
    id: "e3-4",
    source: "3",
    target: "4",
  },
];

function DependencyGraph() {
  return (
    <div className="w-full h-[350px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      />
    </div>
  );
}

export default DependencyGraph;