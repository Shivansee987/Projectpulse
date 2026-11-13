
import { useEffect, useState } from "react";
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
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Simulation History
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Review previous what-if simulations for this project.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading || !projectId}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {!projectId && (
        <p className="text-gray-500 text-sm">
          Select a project to view its simulation history.
        </p>
      )}

      {loading && (
        <p className="text-blue-600 text-sm">
          Loading simulation history...
        </p>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && projectId && history.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="font-medium">No simulations found.</p>
          <p className="text-sm mt-1">
            Run a What-If Simulation to create your first history record.
          </p>
        </div>
      )}

      {!loading && !error && history.length > 0 && (
        <>
          <div className="mb-4 text-sm text-gray-600">
            Total simulations:{" "}
            <span className="font-bold text-gray-900">
              {history.length}
            </span>
          </div>

          <div className="space-y-3">
            {history.map((item) => (
              <article
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {item.taskTitle}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full h-fit ${
                      item.durationChange > 0
                        ? "bg-red-100 text-red-700"
                        : item.durationChange < 0
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {item.durationChange > 0
                      ? `+${item.durationChange} days`
                      : item.durationChange < 0
                      ? `${item.durationChange} days`
                      : "No change"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">
                      Original Duration
                    </p>
                    <p className="text-lg font-bold text-gray-800">
                      {item.originalDuration} days
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">
                      Simulated Duration
                    </p>
                    <p className="text-lg font-bold text-blue-700">
                      {item.simulatedDuration} days
                    </p>
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