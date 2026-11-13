
import { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
} from "reactflow";

import "reactflow/dist/style.css";
import api from "../../services/api";

const statusColors = {
  "In progress": "#3b82f6",
  "At risk": "#ef4444",
  "Done": "#16a34a",
  "Completed": "#16a34a",
  "Not Started": "#64748b",
  "Not started": "#64748b",
};

function TaskNode({ data }) {
  const color = statusColors[data.status] || "#64748b";

  return (
    <div
      style={{
        width: 210,
        padding: 14,
        border: `2px solid ${color}`,
        borderRadius: 10,
        background: "#ffffff",
        color: "#1e293b",
        boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
      }}
    >
      <Handle type="target" position={Position.Left} />

      <div style={{ fontWeight: 700, marginBottom: 8 }}>
        {data.title}
      </div>

      <div style={{ fontSize: 12, color: "#64748b" }}>
        Status: {data.status}
      </div>

      <div style={{ fontSize: 12, color: "#64748b" }}>
        Assignee: {data.assignee || "Unassigned"}
      </div>

      <div style={{ fontSize: 12, color: "#64748b" }}>
        Duration: {data.duration} days
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = {
  task: TaskNode,
};

function DependencyGraph({ tasks = [] }) {
  const [dependencies, setDependencies] = useState([]);
  const [selectedTask, setSelectedTask] = useState("");
  const [selectedPrerequisite, setSelectedPrerequisite] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // LOAD ALL TASK DEPENDENCIES
  useEffect(() => {
    let cancelled = false;

    async function loadDependencies() {
      if (!tasks.length) {
        setDependencies([]);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const responses = await Promise.all(
          tasks.map((task) =>
            api.get(`/dependencies/${task.id}`)
          )
        );

        const allDependencies = responses.flatMap(
          (response) => response.data.dependencies || []
        );

        if (!cancelled) {
          setDependencies(allDependencies);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Could not load dependencies."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDependencies();

    return () => {
      cancelled = true;
    };
  }, [tasks, refreshKey]);

  // CREATE DEPENDENCY
  const handleAddDependency = async (event) => {
    event.preventDefault();

    if (!selectedTask || !selectedPrerequisite) {
      setError("Please select both tasks.");
      return;
    }

    if (selectedTask === selectedPrerequisite) {
      setError("A task cannot depend on itself.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.post("/dependencies", {
        taskId: selectedTask,
        dependsOnTaskId: selectedPrerequisite,
      });

      setSuccess("Dependency created successfully!");

      setSelectedTask("");
      setSelectedPrerequisite("");

      setRefreshKey((current) => current + 1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not create dependency."
      );
    } finally {
      setSaving(false);
    }
  };

  // DELETE DEPENDENCY
  const handleDeleteDependency = async (dependencyId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this dependency?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.delete(`/dependencies/${dependencyId}`);

      setSuccess("Dependency deleted successfully!");

      setRefreshKey((current) => current + 1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not delete dependency."
      );
    }
  };

  // CREATE GRAPH NODES
  const nodes = useMemo(
    () =>
      tasks.map((task, index) => ({
        id: task.id,
        type: "task",
        position: {
          x: 60 + index * 280,
          y: 100,
        },
        data: {
          title: task.title,
          status: task.status,
          assignee: task.assignee,
          duration: task.duration,
        },
      })),
    [tasks]
  );

  // CREATE GRAPH EDGES
  const edges = useMemo(
    () =>
      dependencies.map((dependency) => ({
        id: dependency.id,
        source: dependency.dependsOnTaskId,
        target: dependency.taskId,
        type: "smoothstep",
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        style: {
          stroke: "#16a34a",
          strokeWidth: 2,
        },
      })),
    [dependencies]
  );

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 12,
        padding: 20,
        marginTop: 24,
        border: "1px solid #e2e8f0",
      }}
    >
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>
        Task Dependency Graph
      </h2>

      <p style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>
        Connect tasks and manage their prerequisites.
      </p>

      {/* ADD DEPENDENCY FORM */}
      <form
        onSubmit={handleAddDependency}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginTop: 20,
          alignItems: "end",
        }}
      >
        <div>
          <label style={{ display: "block", marginBottom: 6 }}>
            Task that depends
          </label>

          <select
            value={selectedTask}
            onChange={(event) => setSelectedTask(event.target.value)}
            required
            style={{ width: "100%", padding: 10, borderRadius: 8 }}
          >
            <option value="">Select task</option>

            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6 }}>
            Must be completed first
          </label>

          <select
            value={selectedPrerequisite}
            onChange={(event) =>
              setSelectedPrerequisite(event.target.value)
            }
            required
            style={{ width: "100%", padding: 10, borderRadius: 8 }}
          >
            <option value="">Select prerequisite</option>

            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving || loading || tasks.length < 2}
          style={{
            padding: 11,
            border: "none",
            borderRadius: 8,
            background: "#2563eb",
            color: "#ffffff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {saving ? "Adding..." : "Add Dependency"}
        </button>
      </form>

      {error && (
        <p style={{ color: "#dc2626", marginTop: 12 }}>
          {error}
        </p>
      )}

      {success && (
        <p style={{ color: "#16a34a", marginTop: 12 }}>
          {success}
        </p>
      )}

      {/* EXISTING DEPENDENCIES */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 12 }}>
          Existing Connections
        </h3>

        {loading ? (
          <p>Loading dependencies...</p>
        ) : dependencies.length === 0 ? (
          <p style={{ color: "#64748b" }}>
            No dependencies created yet.
          </p>
        ) : (
          dependencies.map((dependency) => {
            const dependentTask = tasks.find(
              (task) => task.id === dependency.taskId
            );

            const prerequisiteTask = tasks.find(
              (task) => task.id === dependency.dependsOnTaskId
            );

            return (
              <div
                key={dependency.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  marginBottom: 8,
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  flexWrap: "wrap",
                }}
              >
                <span>
                  <strong>{prerequisiteTask?.title || "Task"}</strong>
                  {" → "}
                  <strong>{dependentTask?.title || "Task"}</strong>
                </span>

                <button
                  type="button"
                  onClick={() =>
                    handleDeleteDependency(dependency.id)
                  }
                  style={{
                    padding: "7px 12px",
                    border: "none",
                    borderRadius: 6,
                    background: "#fee2e2",
                    color: "#b91c1c",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* GRAPH */}
      {!loading && tasks.length > 0 && (
        <div style={{ width: "100%", height: 420, marginTop: 24 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            nodesDraggable
            nodesConnectable={false}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      )}
    </div>
  );
}

export default DependencyGraph;
