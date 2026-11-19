
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
import {
  ACTIVE_PROJECT_CHANGE_EVENT,
  getActiveProjectId,
  selectActiveProject,
  syncActiveProject,
} from "../utils/activeProject";

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
          const savedId = getActiveProjectId();
          const selected =
            list.find((project) => project.id === savedId) || list[0];
          setProjectId(selected.id);
          selectActiveProject(selected);
        } else {
          setProjectId("");
          setTasks([]);
          selectActiveProject(null);
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
    function handleActiveProjectChange(event) {
      syncActiveProject(event, setProjects, setProjectId);
      setTasks([]);
      setTaskId("");
      setResult(null);
      setError("");
      setSuccess("");
    }

    window.addEventListener(
      ACTIVE_PROJECT_CHANGE_EVENT,
      handleActiveProjectChange
    );

    return () =>
      window.removeEventListener(
        ACTIVE_PROJECT_CHANGE_EVENT,
        handleActiveProjectChange
      );
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
      <div className="page-shell">

        {/* PAGE HEADER */}
        <div className="glass-panel" style={{ padding: 28 }}>
          <p className="eyebrow">PROJECT PLANNING</p>

          <h1 style={{ marginTop: 8, fontSize: "2.2rem" }}>
            What-If Simulator
          </h1>

          <p className="subtitle" style={{ marginTop: 8 }}>
            Test different task durations and understand
            how they affect your project's schedule and critical path.
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div
            style={{
              marginTop: 20,
              padding: 14,
              borderRadius: 10,
              background: "#fef2f2",
              color: "#b91c1c",
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <AlertCircle size={19} />
            {error}
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {success && (
          <div
            style={{
              marginTop: 20,
              padding: 14,
              borderRadius: 10,
              background: "#ecfdf5",
              color: "#047857",
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
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
                <label>Choose Project</label>

                <select
                  value={projectId}
                  onChange={(e) => {
                    const project =
                      projects.find((item) => item.id === e.target.value) ||
                      null;
                    selectActiveProject(project);
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
                <label>Choose Task</label>

                <select
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
                <label>New Duration (days)</label>

                <input
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
              <div
                style={{
                  marginTop: 18,
                  padding: 16,
                  borderRadius: 10,
                  background: "#eff6ff",
                  color: "#1e40af",
                }}
              >
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 14,
                marginTop: 22,
              }}
            >
              <div
                style={{
                  padding: 18,
                  borderRadius: 12,
                  background: "#f1f5f9",
                }}
              >
                <Clock size={21} />
                <p style={{ fontSize: 13, marginTop: 10 }}>
                  Original Task Duration
                </p>
                <h3 style={{ fontSize: 25, fontWeight: 700 }}>
                  {result.originalDuration} days
                </h3>
              </div>

              <div
                style={{
                  padding: 18,
                  borderRadius: 12,
                  background: "#eff6ff",
                  color: "#1d4ed8",
                }}
              >
                <Activity size={21} />
                <p style={{ fontSize: 13, marginTop: 10 }}>
                  Simulated Task Duration
                </p>
                <h3 style={{ fontSize: 25, fontWeight: 700 }}>
                  {result.simulatedDuration} days
                </h3>
              </div>

              <div
                style={{
                  padding: 18,
                  borderRadius: 12,
                  background: "#ecfdf5",
                  color: "#047857",
                }}
              >
                <TrendingUp size={21} />
                <p style={{ fontSize: 13, marginTop: 10 }}>
                  New Project Duration
                </p>
                <h3 style={{ fontSize: 25, fontWeight: 700 }}>
                  {result.projectDuration} days
                </h3>
              </div>

              <div
                style={{
                  padding: 18,
                  borderRadius: 12,
                  background: "#f5f3ff",
                  color: "#6d28d9",
                }}
              >
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

              <div style={{ overflowX: "auto", marginTop: 16 }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: 650,
                  }}
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
                        <th
                          key={heading}
                          style={{
                            textAlign: "left",
                            padding: 12,
                            borderBottom: "1px solid #e2e8f0",
                            fontSize: 13,
                          }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {result.tasks.map((task) => (
                      <tr key={task.taskId}>
                        <td style={{ padding: 12 }}>
                          {task.title}
                        </td>

                        <td style={{ padding: 12 }}>
                          {task.duration} days
                        </td>

                        <td style={{ padding: 12 }}>{task.ES}</td>
                        <td style={{ padding: 12 }}>{task.EF}</td>
                        <td style={{ padding: 12 }}>{task.LS}</td>
                        <td style={{ padding: 12 }}>{task.LF}</td>
                        <td style={{ padding: 12 }}>{task.slack}</td>

                        <td style={{ padding: 12 }}>
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
            <div
              style={{
                marginTop: 24,
                padding: 18,
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: 12,
              }}
            >
              <h3
                style={{
                  fontWeight: 700,
                  color: "#9a3412",
                  fontSize: 17,
                }}
              >
                Critical Path
              </h3>

              <p
                style={{
                  fontSize: 13,
                  color: "#9a3412",
                  marginTop: 5,
                }}
              >
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
                    <span
                      key={task.taskId}
                      style={{
                        background: "#ffedd5",
                        color: "#9a3412",
                        padding: "9px 13px",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
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
