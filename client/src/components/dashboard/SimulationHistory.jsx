
import { useEffect, useState } from "react";
import {
  RefreshCw,
  History,
  Clock,
} from "lucide-react";
import api from "../../services/api";

function SimulationHistory({ projectId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    if (!projectId) {
      setHistory([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/simulations/project/${projectId}`
      );

      setHistory(response.data.history || []);
    } catch (err) {
      console.error("Simulation history error:", err);
      setError(
        err.response?.data?.message ||
        "Could not load simulation history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [projectId]);

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <section className="simulation-history">
      <style>{`
        .simulation-history {
          --sh-bg: #ffffff;
          --sh-card: #f8fafc;
          --sh-border: #e2e8f0;
          --sh-text: #1e293b;
          --sh-muted: #64748b;
          --sh-blue-bg: #eff6ff;
          --sh-blue: #2563eb;

          background: var(--sh-bg);
          color: var(--sh-text);
          border: 1px solid var(--sh-border);
          border-radius: 18px;
          padding: 24px;
          margin-top: 24px;
          box-shadow: 0 8px 30px rgba(15,23,42,0.05);
          transition: all 0.25s ease;
        }

        :root[data-theme="dark"] .simulation-history {
          --sh-bg: #172033;
          --sh-card: #202c40;
          --sh-border: #334155;
          --sh-text: #f1f5f9;
          --sh-muted: #94a3b8;
          --sh-blue-bg: #1e3a5f;
          --sh-blue: #60a5fa;

          box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        }

        .sh-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
        }

        .sh-heading {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sh-icon {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: var(--sh-blue-bg);
          color: var(--sh-blue);
        }

        .sh-heading h2 {
          font-size: 21px;
          font-weight: 750;
          margin: 0;
          color: var(--sh-text);
        }

        .sh-heading p {
          color: var(--sh-muted);
          font-size: 13px;
          margin: 5px 0 0;
        }

        .sh-refresh {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 10px;
          background: #2563eb;
          color: white;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }

        .sh-refresh:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .sh-refresh:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }

        .sh-summary {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--sh-card);
          border: 1px solid var(--sh-border);
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 18px;
        }

        .sh-summary-icon {
          color: var(--sh-blue);
        }

        .sh-summary-label {
          color: var(--sh-muted);
          font-size: 12px;
        }

        .sh-summary-value {
          color: var(--sh-text);
          font-size: 20px;
          font-weight: 750;
          margin-top: 3px;
        }

        .sh-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .sh-item {
          background: var(--sh-bg);
          border: 1px solid var(--sh-border);
          border-radius: 14px;
          padding: 18px;
          transition: 0.2s;
        }

        .sh-item:hover {
          border-color: var(--sh-blue);
          transform: translateY(-2px);
        }

        .sh-item-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 12px;
        }

        .sh-item h3 {
          color: var(--sh-text);
          font-size: 15px;
          font-weight: 700;
          margin: 0;
        }

        .sh-date {
          display: flex;
          align-items: center;
          gap: 5px;
          color: var(--sh-muted);
          font-size: 12px;
          margin-top: 7px;
        }

        .sh-change {
          font-size: 12px;
          font-weight: 700;
          padding: 7px 11px;
          border-radius: 20px;
          white-space: nowrap;
        }

        .sh-positive {
          background: #fee2e2;
          color: #b91c1c;
        }

        .sh-negative {
          background: #dcfce7;
          color: #15803d;
        }

        .sh-neutral {
          background: #e2e8f0;
          color: #475569;
        }

        .sh-metrics {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 18px;
        }

        .sh-metric {
          background: var(--sh-card);
          border: 1px solid var(--sh-border);
          border-radius: 11px;
          padding: 14px;
        }

        .sh-metric.simulated {
          background: var(--sh-blue-bg);
        }

        .sh-metric-label {
          color: var(--sh-muted);
          font-size: 12px;
        }

        .sh-metric-value {
          color: var(--sh-text);
          font-size: 20px;
          font-weight: 750;
          margin-top: 6px;
        }

        .sh-metric.simulated .sh-metric-value {
          color: var(--sh-blue);
        }

        .sh-state {
          text-align: center;
          padding: 35px 15px;
          color: var(--sh-muted);
          font-size: 13px;
          background: var(--sh-card);
          border: 1px dashed var(--sh-border);
          border-radius: 13px;
        }

        .sh-state strong {
          display: block;
          color: var(--sh-text);
          font-size: 15px;
          margin-bottom: 6px;
        }

        .sh-error {
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 13px;
          border-radius: 10px;
          font-size: 13px;
        }

        @media (max-width: 550px) {
          .simulation-history {
            padding: 16px;
          }

          .sh-metrics {
            grid-template-columns: 1fr;
          }

          .sh-header {
            align-items: stretch;
          }

          .sh-refresh {
            justify-content: center;
          }
        }
      `}</style>

      <div className="sh-header">
        <div className="sh-heading">
          <div className="sh-icon">
            <History size={23} />
          </div>

          <div>
            <h2>Simulation History</h2>
            <p>
              Review previous what-if simulations for this project.
            </p>
          </div>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading || !projectId}
          className="sh-refresh"
        >
          <RefreshCw size={15} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {!projectId && (
        <div className="sh-state">
          Select a project to view its simulation history.
        </div>
      )}

      {loading && (
        <div className="sh-state">
          Loading simulation history...
        </div>
      )}

      {!loading && error && (
        <div className="sh-error">{error}</div>
      )}

      {!loading && !error && projectId && history.length === 0 && (
        <div className="sh-state">
          <History size={30} style={{ marginBottom: 10 }} />
          <strong>No simulations found.</strong>
          Run a What-If Simulation to create your first history record.
        </div>
      )}

      {!loading && !error && history.length > 0 && (
        <>
          <div className="sh-summary">
            <History className="sh-summary-icon" size={25} />
            <div>
              <div className="sh-summary-label">
                Total Simulations
              </div>
              <div className="sh-summary-value">
                {history.length}
              </div>
            </div>
          </div>

          <div className="sh-list">
            {history.map((item) => (
              <article key={item.id} className="sh-item">
                <div className="sh-item-top">
                  <div>
                    <h3>{item.taskTitle}</h3>
                    <p className="sh-date">
                      <Clock size={13} />
                      {formatDate(item.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`sh-change ${
                      item.durationChange > 0
                        ? "sh-positive"
                        : item.durationChange < 0
                        ? "sh-negative"
                        : "sh-neutral"
                    }`}
                  >
                    {item.durationChange > 0
                      ? `+${item.durationChange} days`
                      : item.durationChange < 0
                      ? `${item.durationChange} days`
                      : "No change"}
                  </span>
                </div>

                <div className="sh-metrics">
                  <div className="sh-metric">
                    <div className="sh-metric-label">
                      Original Duration
                    </div>
                    <div className="sh-metric-value">
                      {item.originalDuration} days
                    </div>
                  </div>

                  <div className="sh-metric simulated">
                    <div className="sh-metric-label">
                      Simulated Duration
                    </div>
                    <div className="sh-metric-value">
                      {item.simulatedDuration} days
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default SimulationHistory;
