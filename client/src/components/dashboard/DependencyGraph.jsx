
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
  "In Progress": "#3b82f6",
  "At risk": "#ef4444",
  "At Risk": "#ef4444",
  Done: "#16a34a",
  Completed: "#16a34a",
  "Not Started": "#64748b",
  "Not started": "#64748b",
};

function TaskNode({ data }) {
  const color = data.isCritical
    ? "#dc2626"
    : statusColors[data.status] || "#64748b";

  return (
    <div
      style={{
        width: 220,
        padding: 14,
        border: `3px solid ${color}`,
        borderRadius: 10,
        background: data.isCritical ? "#fff1f2" : "#ffffff",
        color: "#1e293b",
        boxShadow: data.isCritical
          ? "0 0 12px rgba(220,38,38,0.18)"
          : "0 3px 10px rgba(0,0,0,0.08)",
      }}
    >
      <Handle type="target" position={Position.Left} />

      {data.isCritical && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: "#dc2626",
            marginBottom: 7,
          }}
        >
          CRITICAL TASK
        </div>
      )}

      <div style={{ fontWeight: 700, marginBottom: 8 }}>
        {data.title}
      </div>

      <div style={{ fontSize: 12, color: "#64748b" }}>
        Status: {data.status || "Not Started"}
      </div>

      <div style={{ fontSize: 12, color: "#64748b" }}>
        Assignee: {data.assignee || "Unassigned"}
      </div>

      <div style={{ fontSize: 12, color: "#64748b" }}>
        Duration: {data.duration} days
      </div>

      {data.cpmAvailable && (
        <>
          <div style={{ fontSize: 12, marginTop: 5 }}>
            ES: {data.ES} | EF: {data.EF}
          </div>

          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: data.isCritical ? "#dc2626" : "#64748b",
            }}
          >
            Slack: {data.slack} days
          </div>
        </>
      )}

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { task: TaskNode };

// Critical Path Method calculation
function calculateCPM(tasks, dependencies) {
  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  const successors = new Map();
  const predecessors = new Map();
  const indegree = new Map();
  const duration = new Map();

  tasks.forEach((task) => {
    successors.set(task.id, []);
    predecessors.set(task.id, []);
    indegree.set(task.id, 0);
    duration.set(
      task.id,
      Math.max(0, Number(task.duration) || 0)
    );
  });

  dependencies.forEach((dependency) => {
    const from = dependency.dependsOnTaskId;
    const to = dependency.taskId;

    if (!taskMap.has(from) || !taskMap.has(to)) return;

    successors.get(from).push(to);
    predecessors.get(to).push(from);
    indegree.set(to, indegree.get(to) + 1);
  });

  // Topological sorting
  const queue = tasks
    .filter((task) => indegree.get(task.id) === 0)
    .map((task) => task.id);

  const order = [];

  while (queue.length > 0) {
    const current = queue.shift();
    order.push(current);

    successors.get(current).forEach((next) => {
      indegree.set(next, indegree.get(next) - 1);

      if (indegree.get(next) === 0) {
        queue.push(next);
      }
    });
  }

  // Detect circular dependencies
  if (order.length !== tasks.length) {
    return { hasCycle: true };
  }

  const ES = new Map();
  const EF = new Map();
  const LS = new Map();
  const LF = new Map();
  const levels = new Map();

  // Forward pass
  order.forEach((id) => {
    const previousTasks = predecessors.get(id);

    const earliestStart = previousTasks.length
      ? Math.max(...previousTasks.map((prev) => EF.get(prev)))
      : 0;

    ES.set(id, earliestStart);
    EF.set(id, earliestStart + duration.get(id));

    const level = previousTasks.length
      ? Math.max(...previousTasks.map((prev) => levels.get(prev))) + 1
      : 0;

    levels.set(id, level);
  });

  const projectDuration = Math.max(
    0,
    ...Array.from(EF.values())
  );

  // Backward pass
  [...order].reverse().forEach((id) => {
    const nextTasks = successors.get(id);

    const latestFinish = nextTasks.length
      ? Math.min(...nextTasks.map((next) => LS.get(next)))
      : projectDuration;

    LF.set(id, latestFinish);
    LS.set(id, latestFinish - duration.get(id));
  });

  const slack = new Map();
  const criticalTasks = new Set();

  tasks.forEach((task) => {
    const value = LS.get(task.id) - ES.get(task.id);

    slack.set(task.id, value);

    if (Math.abs(value) < 0.000001) {
      criticalTasks.add(task.id);
    }
  });

  return {
    hasCycle: false,
    ES,
    EF,
    LS,
    LF,
    slack,
    levels,
    criticalTasks,
    projectDuration,
  };
}

function DependencyGraph({ tasks = [] }) {
  const [dependencies, setDependencies] = useState([]);
  const [selectedTask, setSelectedTask] = useState("");
  const [selectedPrerequisite, setSelectedPrerequisite] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

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
          tasks.map((task) => api.get(`/dependencies/${task.id}`))
        );

        const allDependencies = responses.flatMap(
          (response) => response.data.dependencies || []
        );

        if (!cancelled) {
          const unique = Array.from(
            new Map(
              allDependencies.map((item) => [item.id, item])
            ).values()
          );

          setDependencies(unique);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Could not load dependencies."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDependencies();

    return () => {
      cancelled = true;
    };
  }, [tasks, refreshKey]);

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

  const handleDeleteDependency = async (dependencyId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this dependency?"
      )
    ) {
      return;
    }

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

  const cpm = useMemo(
    () => calculateCPM(tasks, dependencies),
    [tasks, dependencies]
  );

  // Arrange nodes according to dependency levels
  const nodes = useMemo(() => {
    const rows = new Map();

    return tasks.map((task) => {
      const level =
        !cpm.hasCycle && cpm.levels
          ? cpm.levels.get(task.id) || 0
          : 0;

      const row = rows.get(level) || 0;
      rows.set(level, row + 1);

      const isCritical =
        !cpm.hasCycle &&
        cpm.criticalTasks?.has(task.id);

      return {
        id: task.id,
        type: "task",
        position: {
          x: 60 + level * 320,
          y: 60 + row * 190,
        },
        data: {
          title: task.title,
          status: task.status,
          assignee: task.assignee,
          duration: task.duration,
          isCritical,
          cpmAvailable: !cpm.hasCycle,
          ES: cpm.ES?.get(task.id),
          EF: cpm.EF?.get(task.id),
          slack: cpm.slack?.get(task.id),
        },
      };
    });
  }, [tasks, cpm]);

  const edges = useMemo(
    () =>
      dependencies
        .filter(
          (dependency) =>
            tasks.some((task) => task.id === dependency.dependsOnTaskId) &&
            tasks.some((task) => task.id === dependency.taskId)
        )
        .map((dependency) => {
          const from = dependency.dependsOnTaskId;
          const to = dependency.taskId;

          const isCritical =
            !cpm.hasCycle &&
            cpm.criticalTasks?.has(from) &&
            cpm.criticalTasks?.has(to) &&
            Math.abs(cpm.EF.get(from) - cpm.ES.get(to)) <
              0.000001;

          return {
            id: dependency.id,
            source: from,
            target: to,
            type: "smoothstep",
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isCritical ? "#dc2626" : "#16a34a",
            },
            style: {
              stroke: isCritical ? "#dc2626" : "#16a34a",
              strokeWidth: isCritical ? 4 : 2,
            },
          };
        }),
    [dependencies, tasks, cpm]
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
        Connect tasks and visualize the critical path.
      </p>

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
        <p style={{ color: "#dc2626", marginTop: 12 }}>{error}</p>
      )}

      {success && (
        <p style={{ color: "#16a34a", marginTop: 12 }}>{success}</p>
      )}

      {!loading && tasks.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 18,
            marginTop: 22,
            fontSize: 13,
          }}
        >
          <span style={{ color: "#dc2626", fontWeight: 700 }}>
            ● Critical Task / Path
          </span>

          <span style={{ color: "#16a34a", fontWeight: 700 }}>
            ● Normal Dependency
          </span>
        </div>
      )}

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
                  <strong>
                    {prerequisiteTask?.title || "Task"}
                  </strong>
                  {" → "}
                  <strong>
                    {dependentTask?.title || "Task"}
                  </strong>
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

      {!loading && tasks.length > 0 && (
        <>
          <div
            style={{
              marginTop: 24,
              padding: 16,
              background: "#f8fafc",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
            }}
          >
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>
              Critical Path Analysis
            </h3>

            {cpm.hasCycle ? (
              <p style={{ color: "#dc2626", fontWeight: 600 }}>
                Circular dependency detected. Please fix the task
                connections to calculate the critical path.
              </p>
            ) : (
              <>
                <p style={{ color: "#334155", fontSize: 14 }}>
                  Estimated project duration:{" "}
                  <strong>{cpm.projectDuration} days</strong>
                </p>

                <p style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>
                  Critical tasks: {cpm.criticalTasks.size} / {tasks.length}
                </p>
              </>
            )}
          </div>

          <div
            style={{
              width: "100%",
              height: 520,
              marginTop: 20,
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
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
              <MiniMap
                nodeColor={(node) =>
                  node.data?.isCritical ? "#dc2626" : "#64748b"
                }
              />
            </ReactFlow>
          </div>
        </>
      )}
    </div>
  );
}

export default DependencyGraph;
