
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
import {
  GitBranch,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Activity,
} from "lucide-react";

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
    ? "#ef4444"
    : statusColors[data.status] || "#64748b";

  return (
    <div className={`dependency-task-node ${data.isCritical ? "critical" : ""}`}>
      <Handle type="target" position={Position.Left} />

      {data.isCritical && (
        <div className="dependency-critical-label">
          <AlertTriangle size={11} />
          CRITICAL TASK
        </div>
      )}

      <div className="dependency-node-title">{data.title}</div>

      <div className="dependency-node-status">
        <span style={{ background: color }} />
        {data.status || "Not Started"}
      </div>

      <div className="dependency-node-meta">
        <span>Assignee</span>
        <strong>{data.assignee || "Unassigned"}</strong>
      </div>

      <div className="dependency-node-meta">
        <span>Duration</span>
        <strong>{data.duration ?? 0} days</strong>
      </div>

      {data.cpmAvailable && (
        <div className="dependency-node-cpm">
          <div>ES: {data.ES} · EF: {data.EF}</div>
          <div>Slack: {data.slack} days</div>
        </div>
      )}

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { task: TaskNode };

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
    duration.set(task.id, Math.max(0, Number(task.duration) || 0));
  });

  dependencies.forEach((dependency) => {
    const from = dependency.dependsOnTaskId;
    const to = dependency.taskId;

    if (!taskMap.has(from) || !taskMap.has(to)) return;

    successors.get(from).push(to);
    predecessors.get(to).push(from);
    indegree.set(to, indegree.get(to) + 1);
  });

  const queue = tasks
    .filter((task) => indegree.get(task.id) === 0)
    .map((task) => task.id);

  const order = [];

  while (queue.length) {
    const current = queue.shift();
    order.push(current);

    successors.get(current).forEach((next) => {
      indegree.set(next, indegree.get(next) - 1);

      if (indegree.get(next) === 0) queue.push(next);
    });
  }

  if (order.length !== tasks.length) {
    return { hasCycle: true };
  }

  const ES = new Map();
  const EF = new Map();
  const LS = new Map();
  const LF = new Map();
  const levels = new Map();

  order.forEach((id) => {
    const previous = predecessors.get(id);

    const start = previous.length
      ? Math.max(...previous.map((prev) => EF.get(prev)))
      : 0;

    ES.set(id, start);
    EF.set(id, start + duration.get(id));

    const level = previous.length
      ? Math.max(...previous.map((prev) => levels.get(prev))) + 1
      : 0;

    levels.set(id, level);
  });

  const projectDuration = Math.max(0, ...EF.values());

  [...order].reverse().forEach((id) => {
    const next = successors.get(id);

    const finish = next.length
      ? Math.min(...next.map((item) => LS.get(item)))
      : projectDuration;

    LF.set(id, finish);
    LS.set(id, finish - duration.get(id));
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
            new Map(allDependencies.map((item) => [item.id, item])).values()
          );

          setDependencies(unique);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message || "Could not load dependencies."
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
        err.response?.data?.message || "Could not create dependency."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDependency = async (dependencyId) => {
    if (!window.confirm("Are you sure you want to delete this dependency?")) {
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
        err.response?.data?.message || "Could not delete dependency."
      );
    }
  };

  const cpm = useMemo(
    () => calculateCPM(tasks, dependencies),
    [tasks, dependencies]
  );

  const nodes = useMemo(() => {
    const rows = new Map();

    return tasks.map((task) => {
      const level =
        !cpm.hasCycle && cpm.levels
          ? cpm.levels.get(task.id) || 0
          : 0;

      const row = rows.get(level) || 0;
      rows.set(level, row + 1);

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
          isCritical:
            !cpm.hasCycle && cpm.criticalTasks?.has(task.id),
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
            Math.abs(cpm.EF.get(from) - cpm.ES.get(to)) < 0.000001;

          return {
            id: dependency.id,
            source: from,
            target: to,
            type: "smoothstep",
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isCritical ? "#ef4444" : "#22c55e",
            },
            style: {
              stroke: isCritical ? "#ef4444" : "#22c55e",
              strokeWidth: isCritical ? 3.5 : 2.5,
            },
          };
        }),
    [dependencies, tasks, cpm]
  );

  return (
    <section className="dependency-workspace">
      <style>{`
        .dependency-workspace {
          --dep-panel: #ffffff;
          --dep-surface: #f7f9fd;
          --dep-border: #e4e9f2;
          --dep-text: #182238;
          --dep-muted: #718096;
          margin-top: 24px;
          padding: 25px;
          border-radius: 22px;
          border: 1px solid var(--dep-border);
          background: var(--dep-panel);
          color: var(--dep-text);
          box-shadow: 0 10px 30px rgba(15,23,42,.06);
        }

        :root[data-theme="dark"] .dependency-workspace {
          --dep-panel: #151d30;
          --dep-surface: #101827;
          --dep-border: #2a3851;
          --dep-text: #edf2ff;
          --dep-muted: #9aa9c0;
        }

        .dependency-heading {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 22px;
        }

        .dependency-heading-icon {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          border-radius: 15px;
          background: rgba(99,102,241,.14);
          color: #818cf8;
        }

        .dependency-heading h2 {
          font-size: 21px;
          font-weight: 800;
          margin: 0;
          color: var(--dep-text);
        }

        .dependency-heading p {
          font-size: 13px;
          color: var(--dep-muted);
          margin: 5px 0 0;
        }

        .dependency-form {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
          align-items: end;
          gap: 14px;
          padding: 19px;
          border: 1px solid var(--dep-border);
          border-radius: 16px;
          background: var(--dep-surface);
        }

        .dependency-form label {
          display: block;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 700;
          color: var(--dep-text);
        }

        .dependency-form select {
          width: 100%;
          min-width: 0;
          padding: 12px;
          border: 1px solid var(--dep-border);
          border-radius: 10px;
          outline: none;
          background: var(--dep-panel);
          color: var(--dep-text);
        }

        .dependency-form select:focus {
          border-color: #818cf8;
          box-shadow: 0 0 0 3px rgba(99,102,241,.12);
        }

        .dependency-add-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 17px;
          border: 0;
          border-radius: 10px;
          background: linear-gradient(135deg,#6366f1,#4f46e5);
          color: white;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }

        .dependency-add-button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .dependency-message {
          margin-top: 14px;
          padding: 11px 14px;
          border-radius: 10px;
          font-size: 13px;
        }

        .dependency-message.error {
          background: rgba(239,68,68,.10);
          color: #ef7777;
          border: 1px solid rgba(239,68,68,.22);
        }

        .dependency-message.success {
          background: rgba(34,197,94,.10);
          color: #22a06b;
          border: 1px solid rgba(34,197,94,.22);
        }

        .dependency-section {
          margin-top: 25px;
        }

        .dependency-section-title {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 13px;
          font-size: 15px;
          font-weight: 800;
          color: var(--dep-text);
        }

        .dependency-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 17px;
          padding: 14px 16px;
          border-radius: 12px;
          background: var(--dep-surface);
          border: 1px solid var(--dep-border);
          font-size: 12px;
          color: var(--dep-muted);
        }

        .dependency-legend span {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .dependency-legend i {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .dependency-connection {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding: 14px 16px;
          margin-bottom: 9px;
          border-radius: 13px;
          background: var(--dep-surface);
          border: 1px solid var(--dep-border);
        }

        .dependency-connection-path {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          font-size: 13px;
          color: var(--dep-text);
        }

        .dependency-task-chip {
          padding: 7px 11px;
          border: 1px solid var(--dep-border);
          border-radius: 8px;
          background: var(--dep-panel);
          font-weight: 650;
        }

        .dependency-delete {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 11px;
          border: 1px solid rgba(239,68,68,.22);
          border-radius: 9px;
          background: rgba(239,68,68,.10);
          color: #ef7777;
          font-weight: 700;
          cursor: pointer;
        }

        .dependency-analysis {
          margin-top: 24px;
          padding: 19px;
          border-radius: 16px;
          border: 1px solid var(--dep-border);
          background: var(--dep-surface);
        }

        .dependency-analysis h3 {
          margin: 0 0 12px;
          color: var(--dep-text);
          font-size: 15px;
          font-weight: 800;
        }

        .dependency-analysis p {
          margin: 5px 0;
          color: var(--dep-muted);
          font-size: 13px;
        }

        .dependency-analysis strong {
          color: var(--dep-text);
        }

        .dependency-analysis .cycle-warning {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: #ef7777;
          font-weight: 650;
        }

        .dependency-graph {
          height: 520px;
          margin-top: 18px;
          overflow: hidden;
          border: 1px solid var(--dep-border);
          border-radius: 16px;
          background-color: var(--dep-surface);
        }

        .dependency-graph .react-flow__background {
          background: var(--dep-surface);
        }

        .dependency-graph .react-flow__controls {
          overflow: hidden;
          border: 1px solid var(--dep-border);
          border-radius: 10px;
          box-shadow: none;
        }

        .dependency-graph .react-flow__controls-button {
          background: var(--dep-panel);
          color: var(--dep-text);
          border-bottom: 1px solid var(--dep-border);
          fill: var(--dep-text);
        }

        .dependency-graph .react-flow__minimap {
          background: var(--dep-panel);
          border: 1px solid var(--dep-border);
          border-radius: 10px;
        }

        .dependency-task-node {
          width: 220px;
          padding: 14px;
          border: 2px solid #64748b;
          border-radius: 13px;
          background: #ffffff;
          color: #182238;
          box-shadow: 0 8px 22px rgba(15,23,42,.10);
        }

        :root[data-theme="dark"] .dependency-task-node {
          background: #1b2940;
          color: #edf2ff;
          border-color: #52627e;
          box-shadow: 0 8px 22px rgba(0,0,0,.24);
        }

        .dependency-task-node.critical {
          background: #fff1f2;
          border-color: #ef4444;
        }

        :root[data-theme="dark"] .dependency-task-node.critical {
          background: #39212d;
          color: #ffe4e6;
          border-color: #ef4444;
        }

        .dependency-critical-label {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 7px;
          color: #ef4444;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .7px;
        }

        .dependency-node-title {
          margin-bottom: 10px;
          font-size: 14px;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .dependency-node-status {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 9px;
          font-size: 11px;
          color: #64748b;
        }

        :root[data-theme="dark"] .dependency-node-status {
          color: #b8c5d9;
        }

        .dependency-node-status span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .dependency-node-meta {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-top: 5px;
          font-size: 11px;
        }

        .dependency-node-meta span {
          color: #64748b;
        }

        :root[data-theme="dark"] .dependency-node-meta span {
          color: #a7b5ca;
        }

        .dependency-node-cpm {
          margin-top: 9px;
          padding-top: 8px;
          border-top: 1px solid rgba(128,128,128,.3);
          font-size: 11px;
          font-weight: 700;
          line-height: 1.7;
        }

        @media (max-width: 760px) {
          .dependency-workspace {
            padding: 16px;
          }

          .dependency-form {
            grid-template-columns: 1fr;
          }

          .dependency-add-button {
            width: 100%;
          }

          .dependency-graph {
            height: 450px;
          }
        }

        .dependency-workspace {
          --dep-panel: var(--panel);
          --dep-surface: var(--surface-muted);
          --dep-border: var(--line);
          --dep-text: var(--text);
          --dep-muted: var(--text-soft);
          margin-top: var(--space-5);
          padding: clamp(18px, 3vw, 30px);
          border-color: var(--dep-border);
          border-radius: var(--radius-xl);
          background: var(--dep-panel);
          color: var(--dep-text);
          box-shadow: var(--card-shadow);
          transition: background-color 240ms ease, border-color 240ms ease;
        }

        :root[data-theme] .dependency-workspace {
          --dep-panel: var(--panel);
          --dep-surface: var(--surface-muted);
          --dep-border: var(--line);
          --dep-text: var(--text);
          --dep-muted: var(--text-soft);
        }

        .dependency-heading {
          align-items: flex-start;
        }

        .dependency-heading-icon {
          flex-shrink: 0;
          background: var(--color-pink);
          color: var(--color-navy);
        }

        .dependency-heading h2,
        .dependency-section-title,
        .dependency-analysis h3 {
          letter-spacing: -0.02em;
        }

        .dependency-form {
          background: var(--dep-surface);
          border-color: var(--dep-border);
          border-radius: var(--radius-lg);
        }

        .dependency-form select {
          min-height: 46px;
          border-color: var(--input-border);
          background: var(--input-bg);
          color: var(--dep-text);
          transition: border-color 200ms ease, box-shadow 200ms ease;
        }

        .dependency-form select:focus-visible {
          border-color: var(--focus);
          outline: 3px solid color-mix(in srgb, var(--focus) 25%, transparent);
          outline-offset: 1px;
          box-shadow: none;
        }

        .dependency-add-button {
          min-height: 46px;
          border: 1px solid var(--color-navy);
          border-radius: var(--radius-md);
          background: var(--color-navy);
          color: var(--color-white);
          transition: transform 220ms ease, box-shadow 220ms ease,
            background-color 220ms ease;
        }

        .dependency-add-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: var(--card-shadow);
          background: #1d3d64;
        }

        .dependency-add-button:focus-visible,
        .dependency-delete:focus-visible {
          outline: 3px solid var(--focus);
          outline-offset: 3px;
        }

        .dependency-message {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.5;
        }

        .dependency-message svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .dependency-section-title {
          color: var(--dep-text);
        }

        .dependency-legend,
        .dependency-connection,
        .dependency-analysis {
          background: var(--dep-surface);
          border-color: var(--dep-border);
        }

        .dependency-connection {
          transition: border-color 220ms ease, transform 220ms ease,
            box-shadow 220ms ease;
        }

        .dependency-connection:hover {
          transform: translateY(-1px);
          border-color: color-mix(in srgb, var(--color-navy) 45%, var(--dep-border));
          box-shadow: var(--card-shadow);
        }

        .dependency-task-chip {
          overflow-wrap: anywhere;
          border-color: var(--dep-border);
          background: var(--dep-panel);
          color: var(--dep-text);
        }

        .dependency-delete {
          min-height: 38px;
          transition: background-color 200ms ease, border-color 200ms ease;
        }

        .dependency-delete:hover {
          background: rgba(180, 35, 64, 0.18);
          border-color: rgba(180, 35, 64, 0.4);
        }

        .dependency-analysis {
          border-radius: var(--radius-lg);
        }

        .dependency-graph {
          height: clamp(390px, 55vh, 620px);
          border-color: var(--dep-border);
          border-radius: var(--radius-lg);
          background: var(--dep-surface);
        }

        .dependency-graph .react-flow__controls-button,
        .dependency-graph .react-flow__minimap {
          color: var(--dep-text);
          fill: var(--dep-text);
          border-color: var(--dep-border);
        }

        .dependency-task-node {
          border-color: var(--color-blue);
          border-radius: var(--radius-md);
          background: var(--dep-panel);
          color: var(--dep-text);
          box-shadow: var(--card-shadow);
          transition: box-shadow 220ms ease, border-color 220ms ease;
        }

        .dependency-task-node.critical {
          border-color: #b42340;
          background: color-mix(in srgb, var(--color-pink) 45%, var(--dep-panel));
          color: var(--dep-text);
        }

        :root[data-theme="dark"] .dependency-task-node.critical {
          border-color: #ff8296;
          background: #402634;
          color: #fff3f5;
        }

        .dependency-node-status,
        .dependency-node-meta span {
          color: var(--dep-muted);
        }

        .dependency-node-cpm {
          border-color: var(--dep-border);
          color: var(--dep-text);
        }

        .dependency-graph .react-flow__edge.animated path {
          animation-duration: 2.4s;
        }

        @media (max-width: 560px) {
          .dependency-workspace {
            padding: 16px;
          }

          .dependency-heading {
            gap: 11px;
          }

          .dependency-connection {
            align-items: stretch;
          }

          .dependency-connection-path {
            width: 100%;
          }

          .dependency-delete {
            justify-content: center;
          }

          .dependency-graph {
            height: 410px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .dependency-workspace *,
          .dependency-workspace *::before,
          .dependency-workspace *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }

          .dependency-graph .react-flow__edge.animated path {
            animation: none !important;
          }
        }
      `}</style>

      <div className="dependency-heading">
        <div className="dependency-heading-icon">
          <GitBranch size={23} />
        </div>
        <div>
          <h2>Task Dependency Graph</h2>
          <p>Connect tasks, manage prerequisites and visualize delivery flow.</p>
        </div>
      </div>

      <form className="dependency-form" onSubmit={handleAddDependency}>
        <div>
          <label htmlFor="dependency-target-task">Task that depends</label>
          <select
            id="dependency-target-task"
            value={selectedTask}
            onChange={(event) => setSelectedTask(event.target.value)}
            required
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
          <label htmlFor="dependency-prerequisite-task">
            Must be completed first
          </label>
          <select
            id="dependency-prerequisite-task"
            value={selectedPrerequisite}
            onChange={(event) => setSelectedPrerequisite(event.target.value)}
            required
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
          className="dependency-add-button"
          disabled={saving || loading || tasks.length < 2}
        >
          <Plus size={17} />
          {saving ? "Adding..." : "Add Dependency"}
        </button>
      </form>

      {error && (
        <div className="dependency-message error" role="alert">
          <AlertTriangle size={15} style={{ verticalAlign: "middle" }} />{" "}
          {error}
        </div>
      )}

      {success && (
        <div className="dependency-message success" role="status" aria-live="polite">
          <CheckCircle2 size={15} style={{ verticalAlign: "middle" }} />{" "}
          {success}
        </div>
      )}

      <div className="dependency-section">
        <div className="dependency-section-title">
          <Activity size={17} />
          Graph Legend
        </div>

        <div className="dependency-legend">
          <span><i style={{ background: "#ef4444" }} /> Critical Task / Path</span>
          <span><i style={{ background: "#22c55e" }} /> Normal Dependency</span>
          <span><i style={{ background: "#3b82f6" }} /> In Progress</span>
        </div>
      </div>

      <div className="dependency-section">
        <div className="dependency-section-title">
          <GitBranch size={17} />
          Existing Connections ({dependencies.length})
        </div>

        {loading ? (
          <p style={{ color: "var(--dep-muted)" }} role="status" aria-live="polite">
            Loading dependencies...
          </p>
        ) : dependencies.length === 0 ? (
          <p style={{ color: "var(--dep-muted)", fontSize: 13 }}>
            No dependencies created yet. Add your first connection above.
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
              <div className="dependency-connection" key={dependency.id}>
                <div className="dependency-connection-path">
                  <span className="dependency-task-chip">
                    {prerequisiteTask?.title || "Task"}
                  </span>
                  <GitBranch size={15} color="#22c55e" />
                  <span className="dependency-task-chip">
                    {dependentTask?.title || "Task"}
                  </span>
                </div>

                <button
                  type="button"
                  className="dependency-delete"
                  aria-label={`Delete dependency from ${prerequisiteTask?.title || "task"} to ${dependentTask?.title || "task"}`}
                  onClick={() => handleDeleteDependency(dependency.id)}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            );
          })
        )}
      </div>

      {!loading && tasks.length > 0 && (
        <>
          <div className="dependency-analysis">
            <h3>
              <Activity size={17} style={{ verticalAlign: "middle" }} />{" "}
              Critical Path Analysis
            </h3>

            {cpm.hasCycle ? (
              <p className="cycle-warning">
                <AlertTriangle size={17} />
                Circular dependency detected. Please fix the task connections
                to calculate the critical path.
              </p>
            ) : (
              <>
                <p>
                  Estimated project duration:{" "}
                  <strong>{cpm.projectDuration} days</strong>
                </p>
                <p>
                  Critical tasks:{" "}
                  <strong>{cpm.criticalTasks.size} / {tasks.length}</strong>
                </p>
              </>
            )}
          </div>

          <div className="dependency-section">
            <div className="dependency-section-title">
              <GitBranch size={17} />
              Visual Dependency Map
            </div>

            <div
              className="dependency-graph"
              role="region"
              aria-label="Interactive task dependency graph"
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
                <Background color="#64748b" gap={22} size={1} />
                <Controls />
                <MiniMap
                  nodeColor={(node) =>
                    node.data?.isCritical ? "#ef4444" : "#64748b"
                  }
                />
              </ReactFlow>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default DependencyGraph;
