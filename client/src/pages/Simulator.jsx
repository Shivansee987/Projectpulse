
import { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import Layout from "../components/layout/Layout";
import SimulationHistory from "../components/dashboard/SimulationHistory";
import api from "../services/api";

function Simulator() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [tasks, setTasks] = useState([]);

  const [taskId, setTaskId] = useState("");
  const [simulatedDuration, setSimulatedDuration] = useState("");

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoadingProjects(true);
        setError("");

        const response = await api.get("/projects");
        const list = response.data.projects || response.data;

        setProjects(Array.isArray(list) ? list : []);

        if (Array.isArray(list) && list.length > 0) {
          setProjectId((current) =>
            list.some((project) => project.id === current)
              ? current
              : list[0].id
          );
        } else {
          setProjectId("");
          setTasks([]);
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Could not load projects."
        );
      } finally {
        setLoadingProjects(false);
      }
    }

    loadProjects();
  }, []);

  useEffect(() => {
    async function loadTasks() {
      if (!projectId) {
        setTasks([]);
        setTaskId("");
        return;
      }

      try {
        setLoadingTasks(true);
        setError("");
        setResult(null);

        const response = await api.get("/tasks", {
          params: { projectId },
        });

        const list = response.data.tasks || response.data;
        const safeTasks = Array.isArray(list) ? list : [];

        setTasks(safeTasks);

        setTaskId((current) =>
          safeTasks.some((task) => task.id === current)
            ? current
            : ""
        );
      } catch (err) {
        setTasks([]);
        setTaskId("");
        setError(
          err.response?.data?.message ||
          "Could not load project tasks."
        );
      } finally {
        setLoadingTasks(false);
      }
    }

    loadTasks();
  }, [projectId]);

  // RUN WHAT-IF SIMULATION
  const runSimulation = async (event) => {
    event.preventDefault();

    const duration = Number(simulatedDuration);

    if (!taskId) {
      setError("Please select a task.");
      return;
    }

    if (
      !Number.isInteger(duration) ||
      duration <= 0
    ) {
      setError("Please enter a positive whole number for duration.");
      return;
    }

    try {
      setSimulating(true);
      setError("");
      setSuccess("");
      setResult(null);

      const response = await api.post(
        `/simulations/${taskId}`,
        {
          simulatedDuration: duration,
        }
      );

      setResult(response.data);
      setSuccess(
        response.data.message ||
        "Simulation completed successfully."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not complete simulation."
      );
    } finally {
      setSimulating(false);
    }
  };

  const selectedTask = tasks.find(
    (task) => task.id === taskId
  );

  return (
    <Layout
      activeTab="simulator"
      setActiveTab={() => {}}
    >
      <div className="page-shell phase3-page simulator-page">
        <style>{`
          .simulator-page {
            --sim-panel: var(--panel);
            --sim-surface: var(--surface-muted);
            --sim-border: var(--line);
            --sim-text: var(--text);
            --sim-muted: var(--text-soft);
            max-width: 1440px;
            margin-inline: auto;
          }

          .simulator-hero {
            position: relative;
            overflow: hidden;
            padding: clamp(22px, 4vw, 36px);
            border: 1px solid rgba(220, 229, 240, 0.18);
            border-radius: var(--radius-xl);
            background:
              radial-gradient(circle at 88% 0%, rgba(246, 200, 213, 0.28), transparent 33%),
              linear-gradient(120deg, #142b4a, #1d3d64);
            color: #f8f7fa;
            box-shadow: var(--shadow);
          }

          .simulator-hero .eyebrow {
            color: #f6c8d5;
          }

          .simulator-hero h1 {
            margin-top: 9px;
            font-size: clamp(1.9rem, 3.5vw, 2.6rem);
            letter-spacing: -0.045em;
          }

          .simulator-hero .subtitle {
            max-width: 680px;
            margin-top: 10px;
            color: rgba(248, 247, 250, 0.78);
            line-height: 1.65;
          }

          .simulator-page > .glass-panel {
            border: 1px solid var(--sim-border);
            border-radius: var(--radius-xl);
            background: var(--sim-panel);
            color: var(--sim-text);
            box-shadow: var(--card-shadow);
          }

          .simulator-page .form-group label {
            color: var(--sim-text);
            font-weight: 700;
          }

          .simulator-page .form-group select,
          .simulator-page .form-group input {
            min-height: 46px;
            border: 1px solid var(--input-border);
            border-radius: var(--radius-md);
            background: var(--input-bg);
            color: var(--sim-text);
          }

          .simulator-page .form-group select:focus-visible,
          .simulator-page .form-group input:focus-visible {
            border-color: var(--focus);
            outline: 3px solid color-mix(in srgb, var(--focus) 25%, transparent);
            outline-offset: 1px;
          }

          .simulator-alert,
          .simulator-success {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-top: 20px;
            padding: 14px 16px;
            border: 1px solid transparent;
            border-radius: var(--radius-md);
            line-height: 1.5;
          }

          .simulator-alert {
            border-color: rgba(180, 35, 64, 0.24);
            background: rgba(180, 35, 64, 0.1);
            color: #a51d39;
          }

          .simulator-success {
            border-color: rgba(16, 130, 89, 0.24);
            background: rgba(16, 130, 89, 0.1);
            color: #08744d;
          }

          :root[data-theme="dark"] .simulator-alert {
            color: #ff9aab;
          }

          :root[data-theme="dark"] .simulator-success {
            color: #73ddb0;
          }

          .simulator-alert svg,
          .simulator-success svg {
            flex-shrink: 0;
            margin-top: 2px;
          }

          .simulator-selected-task {
            margin-top: 18px;
            padding: 16px;
            border: 1px solid var(--sim-border);
            border-radius: var(--radius-md);
            background: var(--sim-surface);
            color: var(--sim-text);
          }

          .simulator-selected-task p {
            margin-top: 5px;
            color: var(--sim-muted);
            font-size: 0.875rem;
          }

          .simulator-result-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
            gap: 14px;
            margin-top: 22px;
          }

          .simulator-result-card {
            min-width: 0;
            padding: 18px;
            border: 1px solid var(--sim-border);
            border-radius: var(--radius-lg);
            background: var(--sim-surface);
            color: var(--sim-text);
            transition: transform 240ms ease, box-shadow 240ms ease,
              border-color 240ms ease;
          }

          .simulator-result-card:hover {
            transform: translateY(-2px);
            border-color: var(--color-blue);
            box-shadow: var(--card-shadow);
          }

          .simulator-result-card[data-tone="accent"] {
            background: color-mix(in srgb, var(--color-blue) 38%, var(--sim-panel));
          }

          .simulator-result-card[data-tone="highlight"] {
            background: color-mix(in srgb, var(--color-pink) 35%, var(--sim-panel));
          }

          :root[data-theme="dark"] .simulator-result-card[data-tone="accent"] {
            background: #1c3855;
          }

          :root[data-theme="dark"] .simulator-result-card[data-tone="highlight"] {
            background: #3a2938;
          }

          .simulator-result-card p {
            margin-top: 10px;
            color: var(--sim-muted);
            font-size: 0.8rem;
          }

          .simulator-result-card h3 {
            margin-top: 5px;
            font-size: 1.55rem;
            letter-spacing: -0.035em;
          }

          .simulator-table-wrap {
            overflow-x: auto;
            margin-top: 16px;
            border: 1px solid var(--sim-border);
            border-radius: var(--radius-md);
          }

          .simulator-results-table {
            width: 100%;
            border-collapse: collapse;
            min-width: 650px;
            color: var(--sim-text);
          }

          .simulator-results-table th,
          .simulator-results-table td {
            padding: 12px;
            border-bottom: 1px solid var(--sim-border);
            text-align: left;
            white-space: nowrap;
          }

          .simulator-results-table th {
            background: var(--sim-surface);
            color: var(--sim-muted);
            font-size: 0.75rem;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }

          .simulator-results-table tbody tr:last-child td {
            border-bottom: 0;
          }

          .simulator-critical-path {
            margin-top: 24px;
            padding: 18px;
            border: 1px solid rgba(180, 35, 64, 0.2);
            border-radius: var(--radius-lg);
            background: color-mix(in srgb, var(--color-pink) 24%, var(--sim-panel));
            color: var(--sim-text);
          }

          :root[data-theme="dark"] .simulator-critical-path {
            border-color: rgba(246, 200, 213, 0.24);
            background: #322534;
          }

          .simulator-critical-path h3 {
            color: #a51d39;
          }

          :root[data-theme="dark"] .simulator-critical-path h3 {
            color: #ff9aab;
          }

          .simulator-critical-path p {
            margin-top: 5px;
            color: var(--sim-muted);
            font-size: 0.825rem;
          }

          .simulator-critical-chip {
            display: inline-flex;
            margin-top: 14px;
            padding: 8px 12px;
            border: 1px solid rgba(180, 35, 64, 0.18);
            border-radius: var(--radius-pill);
            background: rgba(180, 35, 64, 0.1);
            color: #a51d39;
            font-size: 0.8rem;
            font-weight: 700;
          }

          :root[data-theme="dark"] .simulator-critical-chip {
            color: #ffb0bd;
          }

          @media (max-width: 560px) {
            .simulator-page > .glass-panel {
              padding: 18px !important;
            }

            .simulator-result-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .simulator-result-card {
              padding: 14px;
            }

            .simulator-result-card h3 {
              font-size: 1.25rem;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .simulator-page *,
            .simulator-page *::before,
            .simulator-page *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              scroll-behavior: auto !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}</style>

        {/* PAGE HEADER */}
        <header className="simulator-hero">
          <p className="eyebrow">PROJECT PLANNING</p>
          <h1>What-If Simulator</h1>
          <p className="subtitle">
            Test different task durations and understand
            how they affect your project's schedule and critical path.
          </p>
        </header>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="simulator-alert" role="alert">
            <AlertCircle size={19} />
            {error}
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="simulator-success" role="status" aria-live="polite">
            <CheckCircle size={19} />
            {success}
          </div>
        )}

        {/* SIMULATION FORM */}
        <div
          className="glass-panel"
          style={{ padding: 24, marginTop: 20 }}
        >
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>
            Configure Simulation
          </h2>

          <p className="subtitle" style={{ marginTop: 6 }}>
            Select a task and enter its hypothetical duration.
          </p>

          <form onSubmit={runSimulation}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 18,
                marginTop: 22,
              }}
            >
              {/* PROJECT SELECT */}
              <div className="form-group">
                <label htmlFor="simulation-project">Choose Project</label>

                <select
                  id="simulation-project"
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    setResult(null);
                    setError("");
                    setSuccess("");
                  }}
                  disabled={loadingProjects || projects.length === 0}
                  required
                >
                  {projects.length === 0 && (
                    <option value="">No projects available</option>
                  )}

                  {projects.map((project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* TASK SELECT */}
              <div className="form-group">
                <label htmlFor="simulation-task">Choose Task</label>

                <select
                  id="simulation-task"
                  value={taskId}
                  onChange={(e) => {
                    setTaskId(e.target.value);
                    setResult(null);
                    setError("");
                    setSuccess("");
                    setSimulatedDuration("");
                  }}
                  disabled={loadingTasks || tasks.length === 0}
                  required
                >
                  <option value="">
                    {loadingTasks
                      ? "Loading tasks..."
                      : tasks.length === 0
                      ? "No tasks available"
                      : "Select a task"}
                  </option>

                  {tasks.map((task) => (
                    <option
                      key={task.id}
                      value={task.id}
                    >
                      {task.title} ({task.duration} days)
                    </option>
                  ))}
                </select>
              </div>

              {/* SIMULATED DURATION */}
              <div className="form-group">
                <label htmlFor="simulation-duration">New Duration (days)</label>

                <input
                  id="simulation-duration"
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="Enter new duration"
                  value={simulatedDuration}
                  onChange={(e) => {
                    setSimulatedDuration(e.target.value);
                    setResult(null);
                    setSuccess("");
                  }}
                  disabled={!taskId}
                />
              </div>
            </div>

            {/* SELECTED TASK INFORMATION */}
            {selectedTask && (
              <div className="simulator-selected-task">
                <strong>{selectedTask.title}</strong>

                <p style={{ fontSize: 14, marginTop: 5 }}>
                  Current duration: {selectedTask.duration} days
                  {" · "}
                  Status: {selectedTask.status || "Not Started"}
                </p>
              </div>
            )}

            <div style={{ marginTop: 22 }}>
              <button
                type="submit"
                className="primary-button"
                disabled={
                  simulating ||
                  loadingTasks ||
                  !projectId ||
                  !taskId ||
                  !simulatedDuration
                }
              >
                {simulating ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />
                    Running Simulation...
                  </>
                ) : (
                  <>
                    <Play size={17} />
                    Run What-If Simulation
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* SIMULATION RESULTS */}
        {result && (
          <div
            className="glass-panel"
            style={{ padding: 24, marginTop: 20 }}
          >
            <div>
              <p className="eyebrow">SIMULATION REPORT</p>

              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  marginTop: 6,
                }}
              >
                Simulation Results
              </h2>

              <p className="subtitle" style={{ marginTop: 6 }}>
                Results for the selected task after changing its duration.
              </p>
            </div>

            {/* RESULT CARDS */}
            <div className="simulator-result-grid">
              <div className="simulator-result-card">
                <Clock size={21} />
                <p style={{ fontSize: 13, marginTop: 10 }}>
                  Original Task Duration
                </p>
                <h3 style={{ fontSize: 25, fontWeight: 700 }}>
                  {result.originalDuration} days
                </h3>
              </div>

              <div className="simulator-result-card" data-tone="accent">
                <Activity size={21} />
                <p style={{ fontSize: 13, marginTop: 10 }}>
                  Simulated Task Duration
                </p>
                <h3 style={{ fontSize: 25, fontWeight: 700 }}>
                  {result.simulatedDuration} days
                </h3>
              </div>

              <div className="simulator-result-card">
                <TrendingUp size={21} />
                <p style={{ fontSize: 13, marginTop: 10 }}>
                  New Project Duration
                </p>
                <h3 style={{ fontSize: 25, fontWeight: 700 }}>
                  {result.projectDuration} days
                </h3>
              </div>

              <div className="simulator-result-card" data-tone="highlight">
                <TrendingDown size={21} />
                <p style={{ fontSize: 13, marginTop: 10 }}>
                  Critical Tasks
                </p>
                <h3 style={{ fontSize: 25, fontWeight: 700 }}>
                  {result.criticalPath.length}
                </h3>
              </div>
            </div>

            {/* TASK RESULTS TABLE */}
            <div style={{ marginTop: 28 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>
                Task Schedule Analysis
              </h3>

              <p className="subtitle" style={{ marginTop: 5 }}>
                Early and late scheduling calculations for every task.
              </p>

              <div className="simulator-table-wrap">
                <table
                  className="simulator-results-table"
                >
                  <thead>
                    <tr>
                      {[
                        "Task",
                        "Duration",
                        "ES",
                        "EF",
                        "LS",
                        "LF",
                        "Slack",
                        "Critical",
                      ].map((heading) => (
                        <th key={heading}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {result.tasks.map((task) => (
                      <tr key={task.taskId}>
                        <td>
                          {task.title}
                        </td>

                        <td>
                          {task.duration} days
                        </td>

                        <td>{task.ES}</td>
                        <td>{task.EF}</td>
                        <td>{task.LS}</td>
                        <td>{task.LF}</td>
                        <td>{task.slack}</td>

                        <td>
                          {task.isCritical ? (
                            <span
                              style={{
                                color: "#b91c1c",
                                fontWeight: 700,
                              }}
                            >
                              Yes
                            </span>
                          ) : (
                            <span style={{ color: "#047857" }}>
                              No
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CRITICAL PATH */}
            <div className="simulator-critical-path">
              <h3>Critical Path</h3>
              <p>
                Tasks with zero slack time.
              </p>

              {result.criticalPath.length === 0 ? (
                <p style={{ marginTop: 12 }}>
                  No critical tasks were returned.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: 14,
                  }}
                >
                  {result.criticalPath.map((task) => (
                    <span key={task.taskId} className="simulator-critical-chip">
                      {task.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SIMULATION HISTORY */}
        <SimulationHistory projectId={projectId} />

      </div>
    </Layout>
  );
}

export default Simulator;
