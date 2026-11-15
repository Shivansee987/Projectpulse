
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  FolderKanban,
  ListTodo,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  Zap,
  HeartPulse,
} from "lucide-react";

import Layout from "../components/layout/Layout";
import api from "../services/api";

const colors = {
  purple: "#7567F8",
  blue: "#3B82F6",
  green: "#16A36A",
  orange: "#F59E0B",
  red: "#EF4444",
  gray: "#94A3B8",
};

const panel = {
  background: "var(--a-panel)",
  border: "1px solid var(--a-border)",
  borderRadius: 18,
  padding: 22,
  minWidth: 0,
  boxShadow: "0 5px 20px rgba(25,35,70,0.035)",
};

const muted = {
  color: "var(--a-muted)",
  fontSize: 12,
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
  const value = String(status).toLowerCase().trim();

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

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <Icon size={19} color={colors.purple} />

        <h3
          style={{
            fontSize: 16,
            fontWeight: 750,
            margin: 0,
            color: "var(--a-text)",
          }}
        >
          {title}
        </h3>
      </div>

      {subtitle && (
        <p style={{ ...muted, margin: "7px 0 0" }}>{subtitle}</p>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  color,
  percentage,
}) {
  return (
    <div
      style={{
        ...panel,
        position: "relative",
        overflow: "hidden",
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div>
          <p style={{ ...muted, fontWeight: 600 }}>{label}</p>

          <h2
            style={{
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: "-1px",
              margin: "12px 0 5px",
              color: "var(--a-text)",
            }}
          >
            {value}
          </h2>

          <p style={muted}>{detail}</p>
        </div>

        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: `${color}20`,
            color,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon size={21} />
        </div>
      </div>

      {percentage !== undefined && (
        <div
          style={{
            height: 5,
            borderRadius: 10,
            background: "var(--a-border)",
            marginTop: 17,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.min(100, Math.max(0, percentage))}%`,
              height: "100%",
              background: color,
              borderRadius: 10,
            }}
          />
        </div>
      )}
    </div>
  );
}

function ProgressBar({ label, value, color, detail }) {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));

  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 8,
          fontSize: 13,
          color: "var(--a-text)",
        }}
      >
        <div>
          <strong style={{ fontWeight: 650 }}>{label}</strong>

          {detail && (
            <span style={{ ...muted, marginLeft: 7 }}>{detail}</span>
          )}
        </div>

        <strong>{safeValue}%</strong>
      </div>

      <div
        style={{
          height: 9,
          borderRadius: 20,
          background: "var(--a-border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${safeValue}%`,
            height: "100%",
            background: color,
            borderRadius: 20,
            transition: "width .4s ease",
          }}
        />
      </div>
    </div>
  );
}

function DonutChart({ items, total }) {
  const values = items.map((item) => item.value);
  const sum = values.reduce((a, b) => a + b, 0);

  let current = 0;

  const gradient = sum
    ? items
        .map((item) => {
          const start = current;
          current += (item.value / sum) * 100;
          return `${item.color} ${start}% ${current}%`;
        })
        .join(", ")
    : "#64748b 0% 100%";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          width: 174,
          height: 174,
          borderRadius: "50%",
          background: `conic-gradient(${gradient})`,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 125,
            height: 125,
            background: "var(--a-panel)",
            borderRadius: "50%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <strong style={{ fontSize: 31, color: "var(--a-text)" }}>
            {total}
          </strong>

          <span style={muted}>Total tasks</span>
        </div>
      </div>

      <div style={{ display: "grid", gap: 14, minWidth: 145 }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 18,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: item.color,
                }}
              />

              <span style={{ fontSize: 13, color: "var(--a-text)" }}>
                {item.label}
              </span>
            </div>

            <strong style={{ fontSize: 13, color: "var(--a-text)" }}>
              {item.value}
            </strong>
          </div>
        ))}
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

      if (list.length) {
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
        setError("Tasks could not be loaded.");
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
      const deadline = task.deadline || task.dueDate;

      if (!deadline || normalizeStatus(task.status) === "completed") {
        return false;
      }

      const due = new Date(deadline);

      return !Number.isNaN(due.getTime()) && due < new Date();
    });

    const workload = {};

    tasks.forEach((task) => {
      const name =
        typeof task.assignee === "object"
          ? task.assignee?.name || "Unassigned"
          : task.assignee || "Unassigned";

      workload[name] = (workload[name] || 0) + 1;
    });

    const team = Object.entries(workload).sort(
      (a, b) => b[1] - a[1]
    );

    const cpmTasks = Array.isArray(cpm?.tasks) ? cpm.tasks : [];
    const criticalSource = cpmTasks.length ? cpmTasks : tasks;

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
      remaining: total - completed,
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

  const insightList = useMemo(() => {
    if (Array.isArray(insights)) return insights;

    return (
      insights?.insights ||
      insights?.recommendations ||
      insights?.suggestions ||
      []
    );
  }, [insights]);

  const riskSummary = risks?.riskSummary || {};

  const distribution = [
    { label: "Completed", value: analytics.completed, color: colors.green },
    { label: "In progress", value: analytics.inProgress, color: colors.blue },
    { label: "At risk", value: analytics.atRisk, color: colors.red },
    { label: "Not started", value: analytics.notStarted, color: colors.gray },
  ];

  const cpmSummary = cpm?.summary || cpm?.data || cpm || {};

  const healthScore = analytics.total
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(
            analytics.progress -
              analytics.overdue.length * 5 -
              analytics.atRisk * 3
          )
        )
      )
    : 0;

  const healthLabel =
    !analytics.total
      ? "No data"
      : healthScore >= 80
      ? "Healthy"
      : healthScore >= 55
      ? "Needs attention"
      : "At risk";

  const healthColor =
    healthScore >= 80
      ? colors.green
      : healthScore >= 55
      ? colors.orange
      : colors.red;

  const refresh = () => {
    if (selectedProject) loadAnalytics(selectedProject);
    else loadProjects();
  };

  return (
    <Layout activeTab="insights" setActiveTab={() => {}}>
      <div className="page-shell analytics-theme">
        <style>{`
          .analytics-theme {
            --a-panel: #ffffff;
            --a-surface: #f8fafc;
            --a-border: #e2e8f0;
            --a-text: #1e293b;
            --a-muted: #718096;
            color: var(--a-text);
            max-width: 1600px;
            margin: 0 auto;
          }

          :root[data-theme="dark"] .analytics-theme {
            --a-panel: #172033;
            --a-surface: #202c40;
            --a-border: #334155;
            --a-text: #f1f5f9;
            --a-muted: #94a3b8;
          }

          .analytics-theme select {
            background: var(--a-panel) !important;
            color: var(--a-text) !important;
            border-color: var(--a-border) !important;
          }

          .analytics-theme select option {
            background: var(--a-panel);
            color: var(--a-text);
          }

          .analytics-theme .analytics-surface {
            background: var(--a-surface) !important;
            color: var(--a-text) !important;
            border-color: var(--a-border) !important;
          }

          .analytics-theme .analytics-warning {
            background: #fef2f2 !important;
            color: #991b1b !important;
          }

          :root[data-theme="dark"] .analytics-theme .analytics-warning {
            background: #451f2b !important;
            color: #fecaca !important;
          }

          .analytics-theme button {
            transition: all .2s ease;
          }

          @media(max-width: 600px) {
            .analytics-theme {
              padding: 0 2px;
            }
          }
        `}</style>

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 18,
            flexWrap: "wrap",
            marginBottom: 25,
          }}
        >
          <div>
            <p
              style={{
                color: colors.purple,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 2,
              }}
            >
              PROJECT INTELLIGENCE CENTER
            </p>

            <h1
              style={{
                fontSize: "clamp(25px, 3vw, 34px)",
                margin: "8px 0",
                color: "var(--a-text)",
              }}
            >
              Advanced Overview
            </h1>

            <p style={{ ...muted, fontSize: 13 }}>
              Your project performance, team activity and delivery insights.
            </p>
          </div>

          <button
            onClick={refresh}
            disabled={loading || detailsLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "11px 17px",
              borderRadius: 11,
              border: "1px solid var(--a-border)",
              background: "var(--a-panel)",
              color: "var(--a-text)",
              cursor: "pointer",
              fontWeight: 650,
            }}
          >
            <RefreshCw size={16} />
            Refresh data
          </button>
        </div>

        {/* Project selector */}
        <div
          style={{
            ...panel,
            marginBottom: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div
              style={{
                width: 43,
                height: 43,
                display: "grid",
                placeItems: "center",
                background: `${colors.purple}20`,
                color: colors.purple,
                borderRadius: 13,
              }}
            >
              <FolderKanban size={21} />
            </div>

            <div>
              <strong>Project overview</strong>
              <p style={{ ...muted, marginTop: 4 }}>
                Select a project to explore its performance.
              </p>
            </div>
          </div>

          <select
            value={selectedProject}
            onChange={(event) => setSelectedProject(event.target.value)}
            disabled={loading || projects.length === 0}
            style={{
              minWidth: 220,
              maxWidth: "100%",
              padding: "11px 14px",
              borderRadius: 10,
              border: "1px solid var(--a-border)",
              background: "var(--a-panel)",
              color: "var(--a-text)",
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

        {loading ? (
          <div style={panel}>Loading your projects...</div>
        ) : error && projects.length === 0 ? (
          <div style={panel}>
            <AlertCircle color={colors.red} />
            <p style={{ marginTop: 10 }}>{error}</p>
            <button onClick={loadProjects} style={{ marginTop: 12 }}>
              Try again
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div style={{ ...panel, textAlign: "center", padding: 45 }}>
            <FolderKanban size={36} color={colors.purple} />
            <h3 style={{ marginTop: 14 }}>No projects yet</h3>
            <p style={muted}>Create a project to see its analytics here.</p>
          </div>
        ) : (
          <>
            {error && (
              <p style={{ color: colors.red, marginBottom: 15 }}>{error}</p>
            )}

            {/* Hero project card */}
            <div
              style={{
                ...panel,
                marginBottom: 22,
                padding: 25,
                background:
                  "linear-gradient(115deg, #25234d 0%, #4841a2 58%, #7567f8 100%)",
                color: "white",
                border: "none",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 20,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 10,
                      letterSpacing: 2,
                      color: "#d6d2ff",
                      fontWeight: 750,
                    }}
                  >
                    CURRENTLY SELECTED PROJECT
                  </p>

                  <h2 style={{ fontSize: 25, margin: "10px 0" }}>
                    {selectedProjectData?.title || "Project"}
                  </h2>

                  <p style={{ color: "#dedcff", fontSize: 12 }}>
                    Deadline: {formatDate(selectedProjectData?.deadline)}
                  </p>
                </div>

                <div
                  style={{
                    width: 112,
                    height: 112,
                    borderRadius: "50%",
                    border: "7px solid rgba(255,255,255,.2)",
                    borderTopColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <strong style={{ fontSize: 27 }}>
                    {analytics.progress}%
                  </strong>

                  <span style={{ fontSize: 10, color: "#e2e0ff" }}>
                    COMPLETED
                  </span>
                </div>
              </div>

              <div
                style={{
                  height: 9,
                  background: "rgba(255,255,255,.2)",
                  borderRadius: 20,
                  overflow: "hidden",
                  marginTop: 23,
                }}
              >
                <div
                  style={{
                    width: `${analytics.progress}%`,
                    height: "100%",
                    background: "#ffffff",
                    borderRadius: 20,
                    transition: "width .4s ease",
                  }}
                />
              </div>

              <p
                style={{
                  color: "#e2e0ff",
                  fontSize: 12,
                  marginTop: 10,
                }}
              >
                {analytics.completed} of {analytics.total} tasks completed
              </p>
            </div>

            {/* KPI Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
                gap: 15,
                marginBottom: 22,
              }}
            >
              <MetricCard
                icon={ListTodo}
                label="Total tasks"
                value={analytics.total}
                detail="Tasks in this project"
                color={colors.purple}
              />

              <MetricCard
                icon={CheckCircle2}
                label="Completed"
                value={analytics.completed}
                detail="Successfully finished"
                color={colors.green}
                percentage={analytics.progress}
              />

              <MetricCard
                icon={Activity}
                label="In progress"
                value={analytics.inProgress}
                detail="Currently active"
                color={colors.blue}
              />

              <MetricCard
                icon={AlertTriangle}
                label="Overdue"
                value={analytics.overdue.length}
                detail="Past their due date"
                color={colors.red}
              />

              <MetricCard
                icon={Target}
                label="Remaining"
                value={analytics.remaining}
                detail="Tasks left to finish"
                color={colors.orange}
              />
            </div>

            {/* Task distribution and Project health */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 18,
                marginBottom: 22,
              }}
            >
              <div style={panel}>
                <SectionTitle
                  icon={BarChart3}
                  title="Task distribution"
                  subtitle="Breakdown of current task statuses"
                />

                {detailsLoading ? (
                  <p style={muted}>Updating chart...</p>
                ) : analytics.total ? (
                  <DonutChart items={distribution} total={analytics.total} />
                ) : (
                  <p style={muted}>Add tasks to view task distribution.</p>
                )}
              </div>

              {/* PROJECT HEALTH */}
              <div style={panel}>
                <SectionTitle
                  icon={ShieldCheck}
                  title="Project Health"
                  subtitle="Overall delivery and schedule health"
                />

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    padding: 17,
                    borderRadius: 15,
                    background: "var(--a-surface)",
                    border: "1px solid var(--a-border)",
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: "50%",
                      background: `conic-gradient(${healthColor} ${healthScore}%, var(--a-border) 0)`,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        background: "var(--a-panel)",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 800,
                        fontSize: 18,
                        color: "var(--a-text)",
                      }}
                    >
                      {healthScore}
                    </div>
                  </div>

                  <div>
                    <p style={muted}>Health score</p>

                    <h2
                      style={{
                        fontSize: 23,
                        fontWeight: 800,
                        color: healthColor,
                        margin: "4px 0",
                      }}
                    >
                      {healthLabel}
                    </h2>

                    <p style={muted}>
                      Based on completion, overdue and at-risk tasks
                    </p>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 11 }}>
                  {[
                    {
                      label: "Completion rate",
                      value: `${analytics.progress}%`,
                      color: colors.green,
                      icon: CheckCircle2,
                    },
                    {
                      label: "Overdue tasks",
                      value: analytics.overdue.length,
                      color: colors.red,
                      icon: Clock3,
                    },
                    {
                      label: "At-risk tasks",
                      value: analytics.atRisk,
                      color: colors.orange,
                      icon: AlertTriangle,
                    },
                    {
                      label: "Critical path tasks",
                      value: analytics.criticalTasks.length,
                      color: colors.purple,
                      icon: Target,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="analytics-surface"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: 13,
                        borderRadius: 12,
                        border: "1px solid var(--a-border)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <item.icon size={18} color={item.color} />
                        <span style={{ fontSize: 13 }}>{item.label}</span>
                      </div>

                      <strong style={{ fontSize: 18, color: item.color }}>
                        {item.value}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Team workload and Schedule */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 18,
                marginBottom: 22,
              }}
            >
              <div style={panel}>
                <SectionTitle
                  icon={Users}
                  title="Team workload"
                  subtitle="Task distribution by assignee"
                />

                {analytics.team.length === 0 ? (
                  <p style={muted}>No task assignees found.</p>
                ) : (
                  analytics.team.map(([name, count], index) => (
                    <ProgressBar
                      key={name}
                      label={name}
                      detail={`${count} tasks`}
                      value={
                        analytics.total
                          ? Math.round((count / analytics.total) * 100)
                          : 0
                      }
                      color={
                        [
                          colors.purple,
                          colors.blue,
                          colors.green,
                          colors.orange,
                        ][index % 4]
                      }
                    />
                  ))
                )}
              </div>

              <div style={panel}>
                <SectionTitle
                  icon={Target}
                  title="Schedule intelligence"
                  subtitle="Critical path and project duration"
                />

                {detailsLoading ? (
                  <p style={muted}>Loading schedule analysis...</p>
                ) : cpm ? (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                      }}
                    >
                      <div
                        className="analytics-surface"
                        style={{
                          borderRadius: 13,
                          padding: 16,
                          border: "1px solid var(--a-border)",
                        }}
                      >
                        <p style={muted}>Project duration</p>

                        <h2 style={{ fontSize: 26, marginTop: 8 }}>
                          {cpm.projectDuration ??
                            cpmSummary.projectDuration ??
                            cpmSummary.totalDuration ??
                            cpmSummary.duration ??
                            "—"}

                          <span style={{ fontSize: 12, fontWeight: 500 }}>
                            {" "}days
                          </span>
                        </h2>
                      </div>

                      <div
                        className="analytics-surface"
                        style={{
                          borderRadius: 13,
                          padding: 16,
                          border: "1px solid var(--a-border)",
                        }}
                      >
                        <p style={muted}>Critical tasks</p>

                        <h2
                          style={{
                            fontSize: 26,
                            marginTop: 8,
                            color: colors.red,
                          }}
                        >
                          {Array.isArray(cpm.criticalPath)
                            ? cpm.criticalPath.length
                            : analytics.criticalTasks.length}
                        </h2>
                      </div>
                    </div>

                    {analytics.criticalTasks.length > 0 && (
                      <div style={{ marginTop: 18 }}>
                        <strong style={{ fontSize: 13 }}>
                          Critical path tasks
                        </strong>

                        {analytics.criticalTasks.map((task, index) => (
                          <div
                            key={task.taskId || task.id || index}
                            className="analytics-surface"
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 10,
                              marginTop: 10,
                              padding: 11,
                              borderRadius: 10,
                              border: "1px solid var(--a-border)",
                            }}
                          >
                            <span style={{ fontSize: 12 }}>
                              {task.title || task.taskTitle || "Project task"}
                            </span>

                            <span style={{ color: colors.red, fontSize: 11 }}>
                              Slack: {task.slack}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p style={muted}>
                    CPM analysis is currently unavailable.
                  </p>
                )}
              </div>
            </div>

            {/* RISK ANALYSIS */}
            <div style={{ ...panel, marginBottom: 22 }}>
              <SectionTitle
                icon={AlertTriangle}
                title="Risk Analysis"
                subtitle="Identify potential project risks and delivery delays"
              />

              {detailsLoading ? (
                <p style={muted}>Checking project risks...</p>
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(130px, 1fr))",
                      gap: 13,
                      marginBottom: 20,
                    }}
                  >
                    {[
                      {
                        label: "High risk",
                        value: riskSummary.high ?? 0,
                        color: colors.red,
                        icon: AlertCircle,
                      },
                      {
                        label: "Medium risk",
                        value: riskSummary.medium ?? 0,
                        color: colors.orange,
                        icon: AlertTriangle,
                      },
                      {
                        label: "Low risk",
                        value: riskSummary.low ?? 0,
                        color: colors.green,
                        icon: ShieldCheck,
                      },
                      {
                        label: "Overdue",
                        value: analytics.overdue.length,
                        color: colors.red,
                        icon: Clock3,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="analytics-surface"
                        style={{
                          padding: 17,
                          borderRadius: 14,
                          border: "1px solid var(--a-border)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                          }}
                        >
                          <p style={muted}>{item.label}</p>
                          <item.icon size={17} color={item.color} />
                        </div>

                        <h2
                          style={{
                            fontSize: 29,
                            marginTop: 10,
                            color: item.color,
                            fontWeight: 800,
                          }}
                        >
                          {item.value}
                        </h2>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      padding: 15,
                      borderRadius: 13,
                      background: "var(--a-surface)",
                      border: "1px solid var(--a-border)",
                      marginBottom: 17,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: 13 }}>
                          Risk monitoring status
                        </strong>

                        <p style={{ ...muted, marginTop: 5 }}>
                          {riskList.length} risk record(s) received
                        </p>
                      </div>

                      <span
                        style={{
                          padding: "7px 12px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 750,
                          background:
                            (riskSummary.high ?? 0) > 0
                              ? "rgba(239,68,68,.15)"
                              : "rgba(22,163,106,.15)",
                          color:
                            (riskSummary.high ?? 0) > 0
                              ? colors.red
                              : colors.green,
                        }}
                      >
                        {(riskSummary.high ?? 0) > 0
                          ? "Attention required"
                          : "No high risks reported"}
                      </span>
                    </div>
                  </div>

                  {riskList.length > 0 ? (
                    <div style={{ display: "grid", gap: 11 }}>
                      {riskList.map((risk, index) => {
                        const level = String(
                          risk.riskLevel || "unknown"
                        ).toLowerCase();

                        const color =
                          level === "high"
                            ? colors.red
                            : level === "medium"
                            ? colors.orange
                            : level === "low"
                            ? colors.green
                            : colors.gray;

                        const background =
                          level === "high"
                            ? "rgba(239,68,68,.12)"
                            : level === "medium"
                            ? "rgba(245,158,11,.12)"
                            : "var(--a-surface)";

                        return (
                          <div
                            key={risk.taskId || risk.id || index}
                            style={{
                              padding: 16,
                              border: "1px solid var(--a-border)",
                              borderRadius: 13,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: 12,
                              background: "var(--a-panel)",
                            }}
                          >
                            <div>
                              <strong
                                style={{
                                  fontSize: 13,
                                  color: "var(--a-text)",
                                }}
                              >
                                {risk.title ||
                                  risk.taskTitle ||
                                  "Project task"}
                              </strong>

                              <p style={{ ...muted, marginTop: 6 }}>
                                Duration: {risk.duration ?? "—"} days
                                {" · "}
                                Slack: {risk.slack ?? "—"} days
                              </p>
                            </div>

                            <span
                              style={{
                                background,
                                color,
                                padding: "7px 13px",
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 750,
                                textTransform: "capitalize",
                              }}
                            >
                              {risk.riskLevel || "Unknown"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      className="analytics-surface"
                      style={{
                        padding: 25,
                        textAlign: "center",
                        borderRadius: 13,
                        border: "1px dashed var(--a-border)",
                      }}
                    >
                      <ShieldCheck
                        size={30}
                        color={colors.green}
                        style={{ margin: "0 auto 10px" }}
                      />

                      <strong>No individual risk records</strong>

                      <p style={{ ...muted, marginTop: 6 }}>
                        No individual risk records were returned by the risk
                        service.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* SMART INSIGHTS */}
            <div style={panel}>
              <SectionTitle
                icon={Zap}
                title="Smart project insights"
                subtitle="Recommendations based on available project analytics"
              />

              {detailsLoading ? (
                <p style={muted}>Generating insights...</p>
              ) : (
                <div style={{ display: "grid", gap: 11 }}>
                  {insightList.length > 0 ? (
                    insightList.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="analytics-surface"
                        style={{
                          padding: 15,
                          borderRadius: 12,
                          border: "1px solid var(--a-border)",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            display: "grid",
                            placeItems: "center",
                            color: colors.purple,
                            background: `${colors.purple}20`,
                            flexShrink: 0,
                          }}
                        >
                          <TrendingUp size={17} />
                        </div>

                        <div>
                          <strong style={{ fontSize: 13 }}>
                            {typeof item === "string"
                              ? `Insight ${index + 1}`
                              : item.title ||
                                item.heading ||
                                item.type ||
                                `Insight ${index + 1}`}
                          </strong>

                          <p style={{ ...muted, marginTop: 6 }}>
                            {typeof item === "string"
                              ? item
                              : item.message ||
                                item.description ||
                                item.recommendation ||
                                "Review this project insight."}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={muted}>
                      No recommendations are currently available from the
                      insights service.
                    </p>
                  )}

                  {analytics.overdue.length > 0 && (
                    <div
                      className="analytics-warning"
                      style={{
                        padding: 15,
                        borderRadius: 12,
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <AlertCircle size={19} />

                      <div>
                        <strong style={{ fontSize: 13 }}>
                          Attention required
                        </strong>

                        <p style={{ fontSize: 12, marginTop: 5 }}>
                          {analytics.overdue.length} unfinished task(s) have
                          passed their deadline. Review their status and
                          delivery plan.
                        </p>
                      </div>
                    </div>
                  )}

                  {analytics.progress < 100 && analytics.total > 0 && (
                    <div
                      className="analytics-surface"
                      style={{
                        padding: 15,
                        borderRadius: 12,
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        border: "1px solid var(--a-border)",
                      }}
                    >
                      <ArrowUpRight color={colors.purple} size={20} />

                      <div>
                        <strong style={{ fontSize: 13 }}>
                          Suggested next step
                        </strong>

                        <p style={{ ...muted, marginTop: 5 }}>
                          Focus on in-progress and at-risk tasks to improve
                          project delivery.
                        </p>
                      </div>
                    </div>
                  )}
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
