
import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";
import api from "../../services/api";

function RiskPanel({ projectId }) {
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRisks = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/risks/${projectId}`);
      setRiskData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load project risk analysis."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRisks();
  }, [projectId]);

  const getRiskColor = (level) => {
    if (level === "High") return "#dc2626";
    if (level === "Medium") return "#d97706";
    return "#16a34a";
  };

  if (!projectId) return null;

  return (
    <section
      className="glass-panel"
      style={{ padding: 24, marginTop: 20 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <p className="eyebrow">PROJECT HEALTH</p>
          <h2 style={{ marginTop: 8 }}>Risk Analysis</h2>
          <p className="subtitle" style={{ marginTop: 6 }}>
            Identify tasks that may put your project schedule at risk.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={loadRisks}
          disabled={loading}
        >
          <RefreshCw size={16} />
          {loading ? "Loading..." : "Refresh Risks"}
        </button>
      </div>

      {loading && !riskData && (
        <p style={{ marginTop: 24 }}>Analyzing project risks...</p>
      )}

      {error && (
        <p style={{ color: "#dc2626", marginTop: 20 }}>
          <AlertTriangle size={16} style={{ verticalAlign: "middle" }} />
          {" "}{error}
        </p>
      )}

      {riskData && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 14,
              marginTop: 24,
            }}
          >
            {[
              {
                label: "High Risk",
                count: riskData.riskSummary?.high ?? 0,
                color: "#dc2626",
              },
              {
                label: "Medium Risk",
                count: riskData.riskSummary?.medium ?? 0,
                color: "#d97706",
              },
              {
                label: "Low Risk",
                count: riskData.riskSummary?.low ?? 0,
                color: "#16a34a",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="glass-panel"
                style={{ padding: 18 }}
              >
                <p className="eyebrow">{item.label}</p>
                <h2 style={{ color: item.color, marginTop: 8 }}>
                  {item.count}
                </h2>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 20,
            }}
          >
            <div className="glass-panel" style={{ padding: 14, flex: 1 }}>
              <p className="eyebrow">PROJECT DURATION</p>
              <h3>{riskData.projectDuration} days</h3>
            </div>

            <div className="glass-panel" style={{ padding: 14, flex: 1 }}>
              <p className="eyebrow">TOTAL TASKS ANALYZED</p>
              <h3>{riskData.totalTasks}</h3>
            </div>
          </div>

          <h3 style={{ marginTop: 28, marginBottom: 14 }}>
            Task Risk Details
          </h3>

          {riskData.tasks?.length > 0 ? (
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
                      "Slack",
                      "Risk Level",
                      "Critical",
                    ].map((heading) => (
                      <th
                        key={heading}
                        align="left"
                        style={{
                          padding: 12,
                          borderBottom: "1px solid rgba(128,128,128,0.25)",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {riskData.tasks.map((task) => (
                    <tr key={task.taskId}>
                      <td style={{ padding: 12 }}>
                        <strong>{task.title}</strong>
                      </td>

                      <td style={{ padding: 12 }}>
                        {task.duration} days
                      </td>

                      <td style={{ padding: 12 }}>
                        {task.slack} days
                      </td>

                      <td style={{ padding: 12 }}>
                        <span
                          style={{
                            color: getRiskColor(task.riskLevel),
                            fontWeight: 700,
                          }}
                        >
                          {task.riskLevel}
                        </span>
                      </td>

                      <td style={{ padding: 12 }}>
                        {task.isCritical ? (
                          <span style={{ color: "#dc2626" }}>
                            <AlertTriangle
                              size={15}
                              style={{ verticalAlign: "middle" }}
                            /> Critical
                          </span>
                        ) : (
                          <span style={{ color: "#16a34a" }}>
                            <ShieldCheck
                              size={15}
                              style={{ verticalAlign: "middle" }}
                            /> No
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No task risk details available.</p>
          )}
        </>
      )}
    </section>
  );
}

export default RiskPanel;

