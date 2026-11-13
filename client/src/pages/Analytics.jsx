
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  FolderKanban,
  ListTodo,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import Layout from "../components/layout/Layout";
import api from "../services/api";

const styles = {
  panel: {
    background: "var(--panel, #ffffff)",
    border: "1px solid var(--border, #e5e7eb)",
    borderRadius: "18px",
    padding: "22px",
    minWidth: 0,
  },
  muted: {
    color: "var(--muted, #64748b)",
    fontSize: "13px",
  },
  heading: {
    fontSize: "16px",
    fontWeight: 700,
    marginBottom: "18px",
  },
};

function getArray(data, keys = []) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function getObject(data) {
  if (!data || typeof data !== "object") return {};
  return data.data || data.result || data;
}

function normalizeStatus(status = "") {
  const value = String(status).toLowerCase();

  if (["done", "completed", "complete"].includes(value)) {
    return "completed";
  }

  if (["in progress", "in_progress", "ongoing"].includes(value)) {
    return "in progress";
  }

  if (["at risk", "at_risk", "delayed", "blocked"].includes(value)) {
    return "at risk";
  }

  return "not started";
}

function formatDate(date) {
  if (!date) return "Not set";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Not set";

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MetricCard({ icon: Icon, label, value, detail, color }) {
  return (
    <div style={styles.panel}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <p style={styles.muted}>{label}</p>
          <h2 style={{ fontSize: "28px", margin: "10px 0 5px", fontWeight: 750 }}>
            {value}
          </h2>
          <p style={styles.muted}>{detail}</p>
        </div>

        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            display: "grid",
            placeItems: "center",
            color,
            background: `${color}18`,
            flexShrink: 0,
          }}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 17 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
          gap: 12,
          fontSize: 13,
        }}
      >
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>

      <div
        style={{
          height: 9,
          borderRadius: 20,
          background: "var(--border, #e5e7eb)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            height: "100%",
            background: color,
            borderRadius: 20,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

function Analytics() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [tasks, setTasks] = useState([]);
  const [cpm, setCpm] = useState(null);
  const [risks, setRisks] = useState(null);
  const [insights, setInsights] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/projects");
      const list = getArray(response.data, ["projects", "data"]);

      setProjects(list);

      if (list.length > 0) {
        setSelectedProject((current) =>
          list.some((project) => project.id === current)
            ? current
            : list[0].id
        );
      } else {
        setSelectedProject("");
        setTasks([]);
        setCpm(null);
        setRisks(null);
        setInsights(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not load projects.");
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (projectId) => {
    if (!projectId) return;

    try {
      setDetailsLoading(true);
      setError("");

      const results = await Promise.allSettled([
        api.get(`/tasks?projectId=${projectId}`),
        api.get(`/cpm/${projectId}`),
        api.get(`/risks/${projectId}`),
        api.get(`/insights/${projectId}`),
      ]);

      const [taskResult, cpmResult, riskResult, insightResult] = results;

      if (taskResult.status === "fulfilled") {
        setTasks(getArray(taskResult.value.data, ["tasks", "data"]));
      } else {
        setTasks([]);
        setError("Tasks could not be loaded. Other analytics may still be available.");
      }

      setCpm(
        cpmResult.status === "fulfilled"
          ? getObject(cpmResult.value.data)
          : null
      );

      setRisks(
        riskResult.status === "fulfilled"
          ? getObject(riskResult.value.data)
          : null
      );

      setInsights(
        insightResult.status === "fulfilled"
          ? getObject(insightResult.value.data)
          : null
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      setTasks([]);
      setCpm(null);
      setRisks(null);
      setInsights(null);
      loadAnalytics(selectedProject);
    }
  }, [selectedProject]);

  const selectedProjectData = projects.find(
    (project) => project.id === selectedProject
  );

  const analytics = useMemo(() => {
    const total = tasks.length;

    const completed = tasks.filter(
      (task) => normalizeStatus(task.status) === "completed"
    ).length;

    const inProgress = tasks.filter(
      (task) => normalizeStatus(task.status) === "in progress"
    ).length;

    const atRisk = tasks.filter(
      (task) => normalizeStatus(task.status) === "at risk"
    ).length;

    const notStarted = tasks.filter(
      (task) => normalizeStatus(task.status) === "not started"
    ).length;

    const progress = total
      ? Math.round((completed / total) * 100)
      : 0;

    const overdue = tasks.filter((task) => {
      if (!task.deadline && !task.dueDate) return false;
      if (normalizeStatus(task.status) === "completed") return false;

      const due = new Date(task.deadline || task.dueDate);

      return !Number.isNaN(due.getTime()) && due < new Date();
    });

    const workload = {};

    tasks.forEach((task) => {
      const name = task.assignee || "Unassigned";
      workload[name] = (workload[name] || 0) + 1;
    });

    const team = Object.entries(workload).sort(
      (a, b) => b[1] - a[1]
    );

    const cpmTasks = Array.isArray(cpm?.tasks)
      ? cpm.tasks
      : [];

    const criticalSource = cpmTasks.length
      ? cpmTasks
      : tasks;

    const criticalTasks = criticalSource.filter(
      (task) => Number(task.slack) <= 0
    );

    return {
      total,
      completed,
      inProgress,
      atRisk,
      notStarted,
      progress,
      overdue,
      team,
      criticalTasks,
    };
  }, [tasks, cpm]);

  const riskList = useMemo(() => {
    if (Array.isArray(risks)) return risks;

    return (
      risks?.tasks ||
      risks?.risks ||
      risks?.items ||
      risks?.warnings ||
      risks?.highRiskTasks ||
      []
    );
  }, [risks]);

  const riskSummary = risks?.riskSummary || {};

  const insightList = useMemo(() => {
    if (Array.isArray(insights)) return insights;

    return (
      insights?.insights ||
      insights?.recommendations ||
      insights?.suggestions ||
      []
    );
  }, [insights]);

  const cpmSummary = cpm?.summary || cpm?.data || cpm || {};

  const refresh = () => {
    if (selectedProject) {
      loadAnalytics(selectedProject);
    } else {
      loadProjects();
    }
  };

  return (
    <Layout activeTab="insights" setActiveTab={() => {}}>
      <div className="page-shell">

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 25,
          }}
        >
          <div>
            <p className="eyebrow">PROJECT INTELLIGENCE</p>

            <h1 style={{ fontSize: "2rem", marginTop: 7 }}>
              Advanced Analytics
            </h1>

            <p className="subtitle" style={{ marginTop: 7 }}>
              Understand progress, identify risks, and make better project decisions.
            </p>
          </div>

          <button
            onClick={refresh}
            disabled={loading || detailsLoading}
            style={{
              padding: "11px 17px",
              borderRadius: 11,
              border: "1px solid var(--border, #e5e7eb)",
              background: "var(--panel, white)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Project selector */}
        <div style={{ ...styles.panel, marginBottom: 22 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              flexWrap: "wrap",
            }}
          >
            <FolderKanban size={22} />

            <div style={{ flex: 1, minWidth: 180 }}>
              <strong>Choose a project</strong>
              <p style={styles.muted}>
                Analytics are calculated for the selected project.
              </p>
            </div>

            <select
              value={selectedProject}
              onChange={(event) => setSelectedProject(event.target.value)}
              disabled={loading || projects.length === 0}
              style={{
                minWidth: 220,
                padding: "11px 13px",
                borderRadius: 10,
                border: "1px solid var(--border, #e5e7eb)",
                background: "var(--panel, white)",
                color: "inherit",
              }}
            >
              {projects.length === 0 && (
                <option value="">No projects available</option>
              )}

              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={styles.panel}>Loading your projects...</div>
        ) : error && projects.length === 0 ? (
          <div style={styles.panel}>
            <AlertCircle color="#ef4444" />
            <p style={{ marginTop: 10 }}>{error}</p>

            <button onClick={loadProjects} style={{ marginTop: 12 }}>
              Try again
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div style={styles.panel}>
            <FolderKanban size={30} />
            <h3 style={{ marginTop: 12 }}>No projects yet</h3>
            <p style={styles.muted}>
              Create a project first. Its analytics will appear here.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <p style={{ color: "#dc2626", marginBottom: 15 }}>
                {error}
              </p>
            )}

            {/* Project overview */}
            <div style={{ ...styles.panel, marginBottom: 22 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 15,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <p style={styles.muted}>SELECTED PROJECT</p>

                  <h2 style={{ fontSize: 22, marginTop: 6 }}>
                    {selectedProjectData?.title || "Project"}
                  </h2>

                  <p style={{ ...styles.muted, marginTop: 7 }}>
                    Deadline: {formatDate(selectedProjectData?.deadline)}
                  </p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <p style={styles.muted}>COMPLETION</p>

                  <h2 style={{ fontSize: 32, marginTop: 4 }}>
                    {analytics.progress}%
                  </h2>
                </div>
              </div>

              <div
                style={{
                  height: 11,
                  background: "var(--border, #e5e7eb)",
                  borderRadius: 20,
                  overflow: "hidden",
                  marginTop: 20,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${analytics.progress}%`,
                    background: "#16a34a",
                    borderRadius: 20,
                  }}
                />
              </div>

              <p style={{ ...styles.muted, marginTop: 9 }}>
                {analytics.completed} of {analytics.total} tasks completed
              </p>
            </div>

            {/* Metric cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 15,
                marginBottom: 22,
              }}
            >
              <MetricCard
                icon={ListTodo}
                label="Total tasks"
                value={analytics.total}
                detail="Tasks in this project"
                color="#6366f1"
              />

              <MetricCard
                icon={CheckCircle2}
                label="Completed"
                value={analytics.completed}
                detail="Successfully finished"
                color="#16a34a"
              />

              <MetricCard
                icon={Activity}
                label="In progress"
                value={analytics.inProgress}
                detail="Currently being worked on"
                color="#2563eb"
              />

              <MetricCard
                icon={AlertTriangle}
                label="At risk"
                value={analytics.atRisk + analytics.overdue.length}
                detail="At-risk or overdue tasks"
                color="#dc2626"
              />
            </div>

            {/* Charts */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 18,
                marginBottom: 22,
              }}
            >
              <div style={styles.panel}>
                <h3 style={styles.heading}>
                  <BarChart3
                    size={18}
                    style={{ verticalAlign: "middle", marginRight: 8 }}
                  />
                  Task distribution
                </h3>

                {analytics.total === 0 ? (
                  <p style={styles.muted}>
                    Add tasks to see the distribution.
                  </p>
                ) : (
                  <>
                    <ProgressBar
                      label="Completed"
                      value={Math.round(
                        (analytics.completed / analytics.total) * 100
                      )}
                      color="#16a34a"
                    />

                    <ProgressBar
                      label="In progress"
                      value={Math.round(
                        (analytics.inProgress / analytics.total) * 100
                      )}
                      color="#2563eb"
                    />

                    <ProgressBar
                      label="At risk"
                      value={Math.round(
                        (analytics.atRisk / analytics.total) * 100
                      )}
                      color="#dc2626"
                    />

                    <ProgressBar
                      label="Not started"
                      value={Math.round(
                        (analytics.notStarted / analytics.total) * 100
                      )}
                      color="#94a3b8"
                    />
                  </>
                )}
              </div>

              <div style={styles.panel}>
                <h3 style={styles.heading}>
                  <ShieldCheck
                    size={18}
                    style={{ verticalAlign: "middle", marginRight: 8 }}
                  />
                  Project health
                </h3>

                <div style={{ display: "grid", gap: 16 }}>
                  <div>
                    <p style={styles.muted}>Overdue tasks</p>
                    <h2 style={{ fontSize: 27, color: "#dc2626", marginTop: 5 }}>
                      {analytics.overdue.length}
                    </h2>
                  </div>

                  <div>
                    <p style={styles.muted}>Critical-path tasks</p>
                    <h2 style={{ fontSize: 27, marginTop: 5 }}>
                      {analytics.criticalTasks.length}
                    </h2>
                  </div>

                  <div>
                    <p style={styles.muted}>Remaining tasks</p>
                    <h2 style={{ fontSize: 27, marginTop: 5 }}>
                      {analytics.total - analytics.completed}
                    </h2>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk monitoring */}
            <div style={{ ...styles.panel, marginBottom: 22 }}>
              <h3 style={styles.heading}>
                <AlertTriangle
                  size={18}
                  style={{
                    verticalAlign: "middle",
                    marginRight: 8,
                    color: "#dc2626",
                  }}
                />
                Risk monitoring
              </h3>

              {detailsLoading ? (
                <p style={styles.muted}>Checking project risks...</p>
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                      gap: 12,
                      marginBottom: 20,
                    }}
                  >
                    {[
                      {
                        label: "High risk",
                        value: riskSummary.high ?? 0,
                        color: "#dc2626",
                      },
                      {
                        label: "Medium risk",
                        value: riskSummary.medium ?? 0,
                        color: "#d97706",
                      },
                      {
                        label: "Low risk",
                        value: riskSummary.low ?? 0,
                        color: "#16a34a",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{
                          padding: 15,
                          borderRadius: 12,
                          background: "var(--surface, #f8fafc)",
                        }}
                      >
                        <p style={styles.muted}>{item.label}</p>

                        <h2
                          style={{
                            fontSize: 27,
                            color: item.color,
                            marginTop: 6,
                          }}
                        >
                          {item.value}
                        </h2>
                      </div>
                    ))}
                  </div>

                  <p style={{ ...styles.muted, marginBottom: 12 }}>
                    Risk assessment for {risks?.totalTasks ?? analytics.total} tasks
                    {risks?.projectDuration != null
                      ? ` · Project duration: ${risks.projectDuration} days`
                      : ""}
                  </p>

                  {riskList.length > 0 ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      {riskList.map((risk, index) => {
                        const level = String(
                          risk.riskLevel || "Unknown"
                        ).toLowerCase();

                        const color =
                          level === "high"
                            ? "#dc2626"
                            : level === "medium"
                            ? "#d97706"
                            : level === "low"
                            ? "#16a34a"
                            : "#64748b";

                        return (
                          <div
                            key={risk.taskId || risk.id || index}
                            style={{
                              padding: 14,
                              borderRadius: 11,
                              background: "var(--surface, #f8fafc)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 12,
                              flexWrap: "wrap",
                            }}
                          >
                            <div>
                              <strong>
                                {risk.title || risk.taskTitle || "Project task"}
                              </strong>

                              <p style={{ ...styles.muted, marginTop: 5 }}>
                                Duration: {risk.duration ?? "—"} days
                                {" · "}
                                Slack: {risk.slack ?? "—"} days
                              </p>
                            </div>

                            <span
                              style={{
                                color,
                                background: `${color}18`,
                                padding: "6px 11px",
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {risk.riskLevel || "Unknown"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={styles.muted}>
                      No individual risk records were returned by the risk engine.
                    </p>
                  )}

                  {analytics.overdue.length > 0 && (
                    <div style={{ marginTop: 18 }}>
                      <strong>Overdue tasks</strong>

                      {analytics.overdue.map((task) => (
                        <p
                          key={task.id}
                          style={{ ...styles.muted, marginTop: 8 }}
                        >
                          • {task.title} — due{" "}
                          {formatDate(task.deadline || task.dueDate)}
                        </p>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* CPM */}
            <div style={{ ...styles.panel, marginBottom: 22 }}>
              <h3 style={styles.heading}>
                <Target
                  size={18}
                  style={{ verticalAlign: "middle", marginRight: 8 }}
                />
                Schedule and critical path
              </h3>

              {detailsLoading ? (
                <p style={styles.muted}>
                  Loading scheduling analysis...
                </p>
              ) : cpm ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 18,
                  }}
                >
                  <div>
                    <p style={styles.muted}>Project duration</p>
                    <h2 style={{ fontSize: 24, marginTop: 6 }}>
                      {cpm.projectDuration ??
                        cpmSummary.projectDuration ??
                        cpmSummary.totalDuration ??
                        cpmSummary.duration ??
                        "—"}
                      {" days"}
                    </h2>
                  </div>

                  <div>
                    <p style={styles.muted}>Critical tasks</p>
                    <h2 style={{ fontSize: 24, marginTop: 6 }}>
                      {Array.isArray(cpm.criticalPath)
                        ? cpm.criticalPath.length
                        : analytics.criticalTasks.length}
                    </h2>
                  </div>

                  <div>
                    <p style={styles.muted}>Schedule analysis</p>
                    <h2 style={{ fontSize: 17, marginTop: 9 }}>
                      {cpm.criticalPath?.length ||
                      analytics.criticalTasks.length
                        ? "Available"
                        : "Loaded"}
                    </h2>
                  </div>
                </div>
              ) : (
                <p style={styles.muted}>
                  CPM analysis is not available right now.
                </p>
              )}

              {analytics.criticalTasks.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <strong>Tasks with zero or negative slack</strong>

                  {analytics.criticalTasks.map((task) => (
                    <p
                      key={task.taskId || task.id}
                      style={{ ...styles.muted, marginTop: 8 }}
                    >
                      • {task.title} — slack: {task.slack}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Team workload */}
            <div style={{ ...styles.panel, marginBottom: 22 }}>
              <h3 style={styles.heading}>
                <Users
                  size={18}
                  style={{ verticalAlign: "middle", marginRight: 8 }}
                />
                Team workload
              </h3>

              {analytics.team.length === 0 ? (
                <p style={styles.muted}>
                  No assignees have been added to tasks yet.
                </p>
              ) : (
                analytics.team.map(([name, count]) => (
                  <ProgressBar
                    key={name}
                    label={name}
                    value={Math.round(
                      (count / analytics.total) * 100
                    )}
                    color="#6366f1"
                  />
                ))
              )}
            </div>

            {/* Insights */}
            <div style={styles.panel}>
              <h3 style={styles.heading}>
                <Zap
                  size={18}
                  style={{
                    verticalAlign: "middle",
                    marginRight: 8,
                    color: "#d97706",
                  }}
                />
                Project insights and recommendations
              </h3>

              {detailsLoading ? (
                <p style={styles.muted}>
                  Generating project insights...
                </p>
              ) : insightList.length > 0 ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {insightList.map((item, index) => (
                    <div
                      key={item.id || index}
                      style={{
                        padding: 14,
                        borderRadius: 11,
                        background: "var(--surface, #f8fafc)",
                      }}
                    >
                      <strong>
                        {typeof item === "string"
                          ? `Insight ${index + 1}`
                          : item.title ||
                            item.heading ||
                            item.type ||
                            `Insight ${index + 1}`}
                      </strong>

                      <p style={{ ...styles.muted, marginTop: 6 }}>
                        {typeof item === "string"
                          ? item
                          : item.message ||
                            item.description ||
                            item.recommendation ||
                            "Review this project insight."}
                      </p>
                    </div>
                  ))}
                </div>
              ) : insights ? (
                <p style={styles.muted}>
                  {insights.message ||
                    insights.summary ||
                    "The insights service returned data, but no recommendations were found."}
                </p>
              ) : (
                <p style={styles.muted}>
                  Insights are currently unavailable. Check that the backend insights endpoint is running.
                </p>
              )}

              {!detailsLoading &&
                analytics.progress < 100 &&
                analytics.total > 0 && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: 14,
                      borderRadius: 11,
                      background: "var(--surface, #f8fafc)",
                    }}
                  >
                    <TrendingUp
                      size={18}
                      style={{ verticalAlign: "middle", marginRight: 8 }}
                    />

                    <strong>Suggested next step</strong>

                    <p style={{ ...styles.muted, marginTop: 6 }}>
                      Focus on completing in-progress tasks and reviewing
                      at-risk tasks to improve project delivery.
                    </p>
                  </div>
                )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

export default Analytics;
