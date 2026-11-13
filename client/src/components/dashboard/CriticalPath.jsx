
import { useEffect, useState } from "react";
import api from "../../services/api";

function CriticalPath({ projectId }) {
  const [cpm, setCpm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!projectId) return;

    let cancelled = false;

    async function loadCPM() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/cpm/${projectId}`);

        if (!cancelled) {
          setCpm(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to calculate critical path."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCPM();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (!projectId) return null;

  if (loading) {
    return <p>Calculating critical path...</p>;
  }

  if (error) {
    return (
      <div className="section-card">
        <h2>Critical Path Analysis</h2>
        <p style={{ color: "#ef4444" }}>{error}</p>
      </div>
    );
  }

  if (!cpm) return null;

  return (
    <div className="section-card" style={{ marginTop: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h2>Critical Path Analysis</h2>
        <p style={{ color: "#64748b", marginTop: 5 }}>
          Automatic project scheduling using Critical Path Method.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="stat-card">
          <p>Project Duration</p>
          <h2>{cpm.projectDuration} Days</h2>
        </div>

        <div className="stat-card">
          <p>Total Tasks</p>
          <h2>{cpm.totalTasks}</h2>
        </div>

        <div className="stat-card">
          <p>Critical Tasks</p>
          <h2>{cpm.criticalPath?.length || 0}</h2>
        </div>
      </div>

      <h3 style={{ marginBottom: 12 }}>Critical Path</h3>

      {cpm.criticalPath?.length ? (
        <div style={{ marginBottom: 24 }}>
          {cpm.criticalPath.map((task, index) => (
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
              <p style={{ fontSize: 13, marginTop: 5 }}>
                Duration: {task.duration} days | Slack: {task.slack} days
              </p>
              {index < cpm.criticalPath.length - 1 && (
                <p style={{ color: "#ef4444", marginTop: 8 }}>
                  ↓ Next critical task
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No critical tasks found.</p>
      )}

      <h3 style={{ marginBottom: 12 }}>Task Schedule</h3>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
            {cpm.tasks?.map((task) => (
              <tr key={task.taskId}>
                <td style={{ padding: 10 }}>{task.title}</td>
                <td style={{ padding: 10 }}>{task.duration}</td>
                <td style={{ padding: 10 }}>{task.ES}</td>
                <td style={{ padding: 10 }}>{task.EF}</td>
                <td style={{ padding: 10 }}>{task.LS}</td>
                <td style={{ padding: 10 }}>{task.LF}</td>
                <td style={{ padding: 10 }}>{task.slack}</td>
                <td style={{ padding: 10 }}>
                  <span
                    style={{
                      color: task.isCritical ? "#dc2626" : "#16a34a",
                      fontWeight: 600,
                    }}
                  >
                    {task.isCritical ? "Critical" : "Non-critical"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CriticalPath;
