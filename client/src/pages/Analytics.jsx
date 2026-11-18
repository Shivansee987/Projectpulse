
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
} from "lucide-react";

import Layout from "../components/layout/Layout";
import api from "../services/api";

const colors = {
  purple: "var(--a-accent)",
  blue: "var(--a-blue)",
  green: "var(--a-green)",
  orange: "var(--a-orange)",
  red: "var(--a-red)",
  gray: "var(--a-gray)",
};

const panel = {
  background: "var(--a-panel)",
  border: "1px solid var(--a-border)",
  borderRadius: 18,
  padding: 22,
  minWidth: 0,
  boxShadow: "var(--card-shadow)",
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
    <div className="analytics-section-title" style={{ marginBottom: 20 }}>
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
      className="analytics-metric-card"
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
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
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
            transition: "width 300ms ease",
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
      className="analytics-donut"
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
  const [projectsRefreshKey, setProjectsRefreshKey] = useState(0);
  const [analyticsRefreshKey, setAnalyticsRefreshKey] = useState(0);

  useEffect(() => {
    async function loadProjects() {
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
    }

    loadProjects();
  }, [projectsRefreshKey]);

  useEffect(() => {
    if (!selectedProject) return;

    async function loadAnalytics() {
      try {
        setDetailsLoading(true);
        setError("");

        const results = await Promise.allSettled([
          api.get(`/tasks?projectId=${selectedProject}`),
          api.get(`/cpm/${selectedProject}`),
          api.get(`/risks/${selectedProject}`),
          api.get(`/insights/${selectedProject}`),
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
    }

    loadAnalytics();
  }, [selectedProject, analyticsRefreshKey]);

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

  const completionProgress = Number.isFinite(analytics.progress)
    ? Math.min(100, Math.max(0, analytics.progress))
    : 0;
  const completionRingCircumference = 2 * Math.PI * 52.5;

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
    if (selectedProject) {
      setDetailsLoading(true);
      setError("");
      setAnalyticsRefreshKey((current) => current + 1);
    } else {
      setLoading(true);
      setError("");
      setProjectsRefreshKey((current) => current + 1);
    }
  };

  return (
    <Layout activeTab="insights" setActiveTab={() => {}}>
      <div className="page-shell analytics-theme">
        <style>{`
          .analytics-theme {
            --a-panel: var(--panel);
            --a-surface: var(--surface-muted);
            --a-border: var(--line);
            --a-text: var(--text);
            --a-muted: var(--text-soft);
            --a-accent: var(--color-navy);
            --a-blue: #426184;
            --a-green: #08744d;
            --a-orange: #96510d;
            --a-red: #a51d39;
            --a-gray: #52657b;
            color: var(--a-text);
            max-width: 1600px;
            margin: 0 auto;
            padding-bottom: 28px;
          }

          :root[data-theme="dark"] .analytics-theme {
            --a-panel: var(--panel);
            --a-surface: var(--surface-muted);
            --a-border: var(--line);
            --a-text: var(--text);
            --a-muted: var(--text-soft);
            --a-accent: var(--color-pink);
            --a-blue: #b8cce1;
            --a-green: #73ddb0;
            --a-orange: #ffd080;
            --a-red: #ff9aab;
            --a-gray: #c1ccda;
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
            border-radius: var(--radius-md);
          }

          .analytics-theme .analytics-warning {
            background: rgba(180, 35, 64, 0.1) !important;
            color: var(--a-red) !important;
            border: 1px solid rgba(180, 35, 64, 0.24);
          }

          .analytics-theme button {
            transition: background-color 220ms ease, border-color 220ms ease,
              color 220ms ease, box-shadow 220ms ease, transform 220ms ease;
          }

          .analytics-theme .analytics-project-hero {
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow);
          }

          .analytics-theme .analytics-surface:hover {
            border-color: color-mix(in srgb, var(--a-accent) 42%, var(--a-border)) !important;
          }

          .analytics-theme .analytics-metric-card {
            border: 1px solid var(--a-border) !important;
            border-radius: var(--radius-lg) !important;
            background: var(--a-panel) !important;
            color: var(--a-text) !important;
            box-shadow: var(--card-shadow) !important;
            transition: transform 240ms ease, border-color 240ms ease,
              box-shadow 240ms ease !important;
          }

          .analytics-theme .analytics-metric-card:hover {
            transform: translateY(-2px);
            border-color: color-mix(in srgb, var(--a-accent) 42%, var(--a-border)) !important;
            box-shadow: var(--shadow) !important;
          }

          .analytics-theme .analytics-section-title > div:first-child {
            gap: 11px !important;
          }

          .analytics-theme .analytics-donut {
            filter: drop-shadow(0 8px 18px rgba(20, 43, 74, 0.1));
            transition: transform 260ms ease;
          }

          .analytics-theme .analytics-donut:hover {
            transform: scale(1.02);
          }

          .analytics-theme .analytics-risk-item {
            border-color: var(--a-border) !important;
            background: var(--a-panel) !important;
          }

          .analytics-theme .analytics-risk-item.analytics-risk-high > span {
            background: rgba(180, 35, 64, 0.12) !important;
            color: var(--a-red) !important;
          }

          .analytics-theme .analytics-risk-item.analytics-risk-medium > span {
            background: rgba(150, 81, 13, 0.12) !important;
            color: var(--a-orange) !important;
          }

          .analytics-theme .analytics-risk-item.analytics-risk-low > span {
            background: rgba(8, 116, 77, 0.12) !important;
            color: var(--a-green) !important;
          }

          .analytics-theme button:focus-visible,
          .analytics-theme select:focus-visible {
            outline: 3px solid var(--focus);
            outline-offset: 3px;
          }

          @media (max-width: 760px) {
            .analytics-theme .analytics-overview-grid,
            .analytics-theme .analytics-detail-grid {
              grid-template-columns: minmax(0, 1fr) !important;
            }

            .analytics-theme .analytics-schedule-metrics {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
          }

          @media(max-width: 600px) {
            .analytics-theme {
              padding: 0 2px;
            }

            .analytics-theme .analytics-project-hero {
              padding: 20px !important;
            }

            .analytics-theme .analytics-kpi-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .analytics-theme .analytics-schedule-metrics {
              grid-template-columns: minmax(0, 1fr) !important;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .analytics-theme *,
            .analytics-theme *::before,
            .analytics-theme *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              scroll-behavior: auto !important;
              transition-duration: 0.01ms !important;
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
            type="button"
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
                background: `color-mix(in srgb, ${colors.purple} 12%, transparent)`,
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
            aria-label="Select analytics project"
            value={selectedProject}
            onChange={(event) => {
              setTasks([]);
              setCpm(null);
              setRisks(null);
              setInsights(null);
              setDetailsLoading(true);
              setError("");
              setSelectedProject(event.target.value);
            }}
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
          <div style={panel} role="status" aria-live="polite">
            Loading your projects...
          </div>
        ) : error && projects.length === 0 ? (
          <div style={panel} role="alert">
            <AlertCircle color={colors.red} />
            <p style={{ marginTop: 10 }}>{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                setError("");
                setProjectsRefreshKey((current) => current + 1);
              }}
              style={{ marginTop: 12 }}
            >
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
              <p style={{ color: colors.red, marginBottom: 15 }} role="alert">
                {error}
              </p>
            )}

            {/* Hero project card */}
            <div
              className="analytics-project-hero"
              style={{
                ...panel,
                marginBottom: 22,
                  padding: 25,
                background:
                    "radial-gradient(circle at 88% 0%, rgba(246, 200, 213, 0.24), transparent 34%), linear-gradient(115deg, #142b4a 0%, #1d3d64 72%, #426184 100%)",
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
                      color: "#f6c8d5",
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
                    position: "relative",
                    width: 112,
                    height: 112,
                    borderRadius: "50%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <svg
                    width="112"
                    height="112"
                    viewBox="0 0 112 112"
                    aria-hidden="true"
                    style={{ position: "absolute", inset: 0 }}
                  >
                    <circle
                      cx="56"
                      cy="56"
                      r="52.5"
                      fill="none"
                      stroke="rgba(255,255,255,.2)"
                      strokeWidth="7"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="52.5"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="7"
                      strokeLinecap="butt"
                      strokeDasharray={`${completionRingCircumference} ${completionRingCircumference}`}
                      strokeDashoffset={
                        completionRingCircumference *
                        (1 - completionProgress / 100)
                      }
                      transform="rotate(-90 56 56)"
                      style={{
                        opacity: completionProgress <= 0 ? 0 : 1,
                        transition:
                          "stroke-dashoffset 300ms ease, opacity 200ms ease",
                      }}
                    />
                  </svg>

                  <strong style={{ fontSize: 27 }}>
                    {completionProgress}%
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
                    transition: "width 300ms ease",
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
              className="analytics-kpi-grid"
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
              className="analytics-overview-grid"
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
              className="analytics-detail-grid"
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
                      className="analytics-schedule-metrics"
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
            <div
              className="analytics-risk-panel"
              style={{ ...panel, marginBottom: 22 }}
            >
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
                            className={`analytics-risk-item analytics-risk-${level}`}
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
            <div className="analytics-insights-panel" style={panel}>
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
                            background: `color-mix(in srgb, ${colors.purple} 12%, transparent)`,
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
