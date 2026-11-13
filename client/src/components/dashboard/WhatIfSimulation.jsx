
import { useEffect, useState } from "react";
import api from "../../services/api";

function WhatIfSimulation({ projectId, tasks = [] }) {
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [simulatedDuration, setSimulatedDuration] = useState("");
  const [originalProjectDuration, setOriginalProjectDuration] =
    useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (tasks.length > 0) {
      setSelectedTaskId((current) =>
        tasks.some((task) => task.id === current)
          ? current
          : tasks[0].id
      );
    } else {
      setSelectedTaskId("");
    }

    setResult(null);
    setError("");
    setSimulatedDuration("");
  }, [tasks, projectId]);

  useEffect(() => {
    if (!projectId) return;

    let cancelled = false;

    async function loadOriginalCPM() {
      try {
        const response = await api.get(`/cpm/${projectId}`);

        if (!cancelled) {
          setOriginalProjectDuration(
            response.data.projectDuration
          );
        }
      } catch {
        if (!cancelled) {
          setOriginalProjectDuration(null);
        }
      }
    }

    loadOriginalCPM();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const selectedTask = tasks.find(
    (task) => task.id === selectedTaskId
  );

  async function runSimulation(e) {
    e.preventDefault();

    if (!selectedTaskId || !simulatedDuration) {
      setError("Please select a task and enter a duration.");
      return;
    }

    const duration = Number(simulatedDuration);

    if (!Number.isInteger(duration) || duration <= 0) {
      setError("Duration must be a positive whole number.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const response = await api.post(
        `/simulations/${selectedTaskId}`,
        { simulatedDuration: duration }
      );

      setResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to run simulation."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!projectId) return null;

  return (
    <div className="section-card" style={{ marginTop: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h2>What-If Simulation</h2>
        <p style={{ color: "#64748b", marginTop: 5 }}>
          Change a task duration and see how it affects
          the overall project schedule.
        </p>
      </div>

      <form onSubmit={runSimulation}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            alignItems: "end",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Select Task
            </label>

            <select
              value={selectedTaskId}
              onChange={(e) => {
                setSelectedTaskId(e.target.value);
                setResult(null);
                setError("");
                setSimulatedDuration("");
              }}
              disabled={tasks.length === 0 || loading}
              style={{
                width: "100%",
                padding: 12,
                border: "1px solid #cbd5e1",
                borderRadius: 8,
              }}
            >
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              New Duration (Days)
            </label>

            <input
              type="number"
              min="1"
              step="1"
              value={simulatedDuration}
              onChange={(e) =>
                setSimulatedDuration(e.target.value)
              }
              placeholder={
                selectedTask
                  ? `Current: ${selectedTask.duration} days`
                  : "Enter duration"
              }
              disabled={!selectedTask || loading}
              style={{
                width: "100%",
                padding: 12,
                border: "1px solid #cbd5e1",
                borderRadius: 8,
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!selectedTask || loading}
            style={{
              padding: 12,
              border: "none",
              borderRadius: 8,
              background: "#2563eb",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {loading ? "Simulating..." : "Run Simulation"}
          </button>
        </div>
      </form>

      {tasks.length === 0 && (
        <p style={{ marginTop: 16 }}>
          Add tasks to this project before running a simulation.
        </p>
      )}

      {error && (
        <p style={{ color: "#dc2626", marginTop: 16 }}>
          {error}
        </p>
      )}

      {result && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ marginBottom: 16 }}>
            Simulation Results
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 16,
            }}
          >
            <div className="stat-card">
              <p>Original Task Duration</p>
              <h2>{result.originalDuration} Days</h2>
            </div>

            <div className="stat-card">
              <p>New Task Duration</p>
              <h2>{result.simulatedDuration} Days</h2>
            </div>

            <div className="stat-card">
              <p>Original Project Duration</p>
              <h2>
                {originalProjectDuration ?? "N/A"}
                {originalProjectDuration !== null ? " Days" : ""}
              </h2>
            </div>

            <div className="stat-card">
              <p>Simulated Project Duration</p>
              <h2>{result.projectDuration} Days</h2>
            </div>
          </div>

          {originalProjectDuration !== null && (
            <div
              style={{
                marginTop: 18,
                padding: 14,
                borderRadius: 8,
                background: "#eff6ff",
              }}
            >
              <strong>
                Project duration impact:{" "}
                {result.projectDuration - originalProjectDuration > 0
                  ? `+${result.projectDuration - originalProjectDuration}`
                  : result.projectDuration - originalProjectDuration}{" "}
                days
              </strong>
              <p style={{ marginTop: 5 }}>
                {result.projectDuration > originalProjectDuration
                  ? "The project will take longer."
                  : result.projectDuration < originalProjectDuration
                  ? "The project will finish sooner."
                  : "The overall project duration remains unchanged."}
              </p>
            </div>
          )}

          <h3 style={{ marginTop: 24, marginBottom: 12 }}>
            Simulated Critical Path
          </h3>

          {result.criticalPath?.length > 0 ? (
            result.criticalPath.map((task, index) => (
              <div
                key={task.taskId}
                style={{
                  padding: 14,
                  marginBottom: 10,
                  border: "1px solid #fecaca",
                  borderLeft: "5px solid #ef4444",
                  borderRadius: 8,
                  background: "#fff7f7",
                }}
              >
                <strong>{task.title}</strong>
                <p style={{ marginTop: 5, fontSize: 13 }}>
                  Duration: {task.duration} days | Slack:{" "}
                  {task.slack} days
                </p>
                {index < result.criticalPath.length - 1 && (
                  <p style={{ color: "#dc2626", marginTop: 8 }}>
                    ↓ Next critical task
                  </p>
                )}
              </div>
            ))
          ) : (
            <p>No critical path data available.</p>
          )}

          <h3 style={{ marginTop: 24, marginBottom: 12 }}>
            Simulated Task Schedule
          </h3>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
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
                    "Status",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: 10,
                        textAlign: "left",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {result.tasks?.map((task) => (
                  <tr key={task.taskId}>
                    <td style={{ padding: 10 }}>{task.title}</td>
                    <td style={{ padding: 10 }}>{task.duration}</td>
                    <td style={{ padding: 10 }}>{task.ES}</td>
                    <td style={{ padding: 10 }}>{task.EF}</td>
                    <td style={{ padding: 10 }}>{task.LS}</td>
                    <td style={{ padding: 10 }}>{task.LF}</td>
                    <td style={{ padding: 10 }}>{task.slack}</td>
                    <td
                      style={{
                        padding: 10,
                        color: task.isCritical ? "#dc2626" : "#16a34a",
                        fontWeight: 600,
                      }}
                    >
                      {task.isCritical ? "Critical" : "Non-critical"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default WhatIfSimulation;
