import { useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  RefreshCw,
  CheckCircle2,
  Clock3,
  ListTodo,
  Pencil,
  AlertCircle,
  CalendarDays,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

import Layout from "../components/layout/Layout";
import api from "../services/api";
import ProjectReport from "../components/dashboard/ProjectReport";

const emptyProjectForm = {
  title: "",
  description: "",
  startDate: "",
  deadline: "",
};

function toDateInputValue(value) {
  return value ? String(value).slice(0, 10) : "";
}

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projectRefreshKey, setProjectRefreshKey] = useState(0);
  const [tasksRefreshKey, setTasksRefreshKey] = useState(0);

  const [reportCpm, setReportCpm] = useState(null);
  const [reportRisks, setReportRisks] = useState(null);
  const [reportHistory, setReportHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/projects");
        const list = response.data.projects || response.data;
        const savedProjectId = localStorage.getItem("activeProjectId");

        setProjects(list);

        if (list.length > 0) {
          setActiveProject((current) =>
            list.find((project) => project.id === current?.id) ||
            list.find((project) => project.id === savedProjectId) ||
            list[0]
          );
        } else {
          setActiveProject(null);
          setTasks([]);
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "Projects could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [projectRefreshKey]);

  useEffect(() => {
    function syncActiveProject(event) {
      const projectId = event.detail?.projectId;

      if (!projectId) {
        setActiveProject(null);
        return;
      }

      const selected = projects.find((project) => project.id === projectId);
      if (selected) setActiveProject(selected);
    }

    window.addEventListener(
      "projectpulse:active-project-change",
      syncActiveProject
    );

    return () =>
      window.removeEventListener(
        "projectpulse:active-project-change",
        syncActiveProject
      );
  }, [projects]);

  useEffect(() => {
    if (activeProject?.id) {
      localStorage.setItem("activeProjectId", activeProject.id);
    } else if (!loading) {
      localStorage.removeItem("activeProjectId");
    }

    window.dispatchEvent(
      new CustomEvent("projectpulse:active-project-change", {
        detail: {
          projectId: activeProject?.id || "",
          project: activeProject,
        },
      })
    );
  }, [activeProject, loading]);

  useEffect(() => {
    if (!activeProject?.id) return;

    async function loadTasks() {
      try {
        setTasksLoading(true);

        const response = await api.get("/tasks", {
          params: { projectId: activeProject.id },
        });

        const list = response.data.tasks || response.data;
        setTasks(Array.isArray(list) ? list : []);
      } catch (err) {
        setError(err.response?.data?.message || "Tasks could not be loaded.");
        setTasks([]);
      } finally {
        setTasksLoading(false);
      }
    }

    loadTasks();
  }, [activeProject?.id, tasksRefreshKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadReportData() {
      if (!activeProject?.id) {
        setReportCpm(null);
        setReportRisks(null);
        setReportHistory([]);
        return;
      }

      setReportCpm(null);
      setReportRisks(null);
      setReportHistory([]);

      const projectId = activeProject.id;

      const results = await Promise.allSettled([
        api.get(`/cpm/${projectId}`),
        api.get(`/risks/${projectId}`),
        api.get(`/simulations/project/${projectId}`),
      ]);

      if (cancelled) return;

      if (results[0].status === "fulfilled") {
        setReportCpm(results[0].value.data);
      }

      if (results[1].status === "fulfilled") {
        setReportRisks(results[1].value.data);
      }

      if (results[2].status === "fulfilled") {
        setReportHistory(results[2].value.data.history || []);
      }
    }

    loadReportData();

    return () => {
      cancelled = true;
    };
  }, [activeProject?.id]);

  const completedTasks = tasks.filter((task) =>
    ["completed", "done"].includes(
      String(task.status || "").toLowerCase()
    )
  ).length;

  const progress = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  const totalDuration = useMemo(
    () =>
      tasks.reduce(
        (total, task) => total + Number(task.duration || 0),
        0
      ),
    [tasks]
  );

  const filteredProjects = projects.filter((project) =>
    String(project.title || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const openCreateProject = () => {
    setEditingProject(null);
    setProjectForm(emptyProjectForm);
    setProjectModalOpen(true);
  };

  const openEditProject = () => {
    if (!activeProject) return;

    setEditingProject(activeProject);
    setProjectForm({
      title: activeProject.title || "",
      description: activeProject.description || "",
      startDate: toDateInputValue(activeProject.startDate),
      deadline: toDateInputValue(activeProject.deadline),
    });

    setProjectModalOpen(true);
  };

  const saveProject = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (editingProject) {
        const response = await api.put(
          `/projects/${editingProject.id}`,
          projectForm
        );

        const updated = response.data.project || response.data;

        setProjects((current) =>
          current.map((project) =>
            project.id === updated.id ? updated : project
          )
        );

        setActiveProject(updated);
      } else {
        const response = await api.post("/projects", projectForm);
        const created = response.data.project || response.data;

        setProjects((current) => [...current, created]);
        setActiveProject(created);
      }

      setProjectModalOpen(false);
      setEditingProject(null);
      setProjectForm(emptyProjectForm);
    } catch (err) {
      setError(err.response?.data?.message || "Project could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const layoutProps = {
    activeTab: "overview",
    setActiveTab: () => {},
    onSearch: setSearchQuery,
  };

  if (loading) {
    return (
      <Layout {...layoutProps}>
        <div className="page-shell">
          <div className="phase2-loading" role="status">
            Loading your ProjectPulse workspace...
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout {...layoutProps}>
      <div className="page-shell dashboard-page">
        <section className="dashboard-hero">
          <div className="dashboard-hero-copy">
            <p className="eyebrow">PROJECTPULSE WORKSPACE</p>
            <h1>Your work, in focus.</h1>
            <p className="subtitle">
              A clear view of your projects, task progress and delivery health.
            </p>
          </div>
          <button
            type="button"
            className="primary-button dashboard-create-button"
            onClick={openCreateProject}
          >
            <FolderKanban size={17} /> New project
          </button>
        </section>

        {error && (
          <div className="phase2-alert" role="alert">
            <AlertCircle size={17} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <section className="dashboard-projects-section">
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">YOUR PORTFOLIO</p>
              <h2>Project overview</h2>
            </div>
            <label className="dashboard-project-selector">
              <span className="eyebrow">ACTIVE PROJECT</span>
              <select
                id="project-selector"
                value={activeProject?.id || ""}
                onChange={(event) => {
                  const selected = projects.find(
                    (project) => project.id === event.target.value
                  );
                  setActiveProject(selected || null);
                  if (!selected) {
                    setTasks([]);
                    setTasksLoading(false);
                  }
                }}
              >
                <option value="">Choose a project</option>
                {filteredProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {filteredProjects.length > 0 ? (
            <div className="dashboard-project-grid">
              {filteredProjects.map((project) => {
                const isActive = project.id === activeProject?.id;
                const taskCount = project._count?.tasks ??
                  (isActive ? tasks.length : null);

                return (
                  <button
                    type="button"
                    key={project.id}
                    className={`dashboard-project-card${isActive ? " is-active" : ""}`}
                    onClick={() => setActiveProject(project)}
                    aria-pressed={isActive}
                  >
                    <span className="dashboard-project-card-top">
                      <span className="dashboard-project-icon">
                        <FolderKanban size={19} />
                      </span>
                      <ChevronRight size={17} aria-hidden="true" />
                    </span>
                    <span className="dashboard-project-title">{project.title}</span>
                    <span className="dashboard-project-meta">
                      {taskCount === null
                        ? "Task count unavailable"
                        : `${taskCount} ${taskCount === 1 ? "task" : "tasks"}`}
                    </span>
                    {isActive && (
                      <>
                        <span className="dashboard-project-progress-label">
                          <span>Completed tasks</span>
                          <strong>{tasksLoading ? "Loading" : `${progress}%`}</strong>
                        </span>
                        <span
                          className="dashboard-project-progress"
                          aria-hidden="true"
                        >
                          <span
                            style={{
                              width: tasksLoading ? "0%" : `${progress}%`,
                            }}
                          />
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <FolderKanban size={24} />
              <h2>{projects.length ? "No matching projects" : "No projects yet"}</h2>
              <p className="subtitle">
                {projects.length
                  ? "Adjust your search to see another project."
                  : "Create a project to start organizing your tasks and tracking progress."}
              </p>
              <button
                type="button"
                className="primary-button"
                onClick={openCreateProject}
              >
                New project
              </button>
            </div>
          )}
        </section>

        {activeProject ? (
          <>
            <section className="dashboard-kpi-grid" aria-label="Project statistics">
              <article className="dashboard-kpi-card">
                <span className="dashboard-kpi-icon navy">
                  <FolderKanban size={20} />
                </span>
                <span className="eyebrow">TOTAL TASKS</span>
                <strong>{tasksLoading ? "..." : tasks.length}</strong>
                <span className="dashboard-kpi-note">In this project</span>
              </article>
              <article className="dashboard-kpi-card">
                <span className="dashboard-kpi-icon pink">
                  <CheckCircle2 size={20} />
                </span>
                <span className="eyebrow">COMPLETED</span>
                <strong>{tasksLoading ? "..." : completedTasks}</strong>
                <span className="dashboard-kpi-note">Tasks marked complete</span>
              </article>
              <article className="dashboard-kpi-card">
                <span className="dashboard-kpi-icon blue">
                  <Clock3 size={20} />
                </span>
                <span className="eyebrow">PLANNED EFFORT</span>
                <strong>{tasksLoading ? "..." : `${totalDuration} days`}</strong>
                <span className="dashboard-kpi-note">Sum of task durations</span>
              </article>
              <article className="dashboard-kpi-card">
                <span className="dashboard-kpi-icon navy">
                  <ListTodo size={20} />
                </span>
                <span className="eyebrow">PROJECT PROGRESS</span>
                <strong>{tasksLoading ? "..." : `${progress}%`}</strong>
                <span className="dashboard-kpi-note">Based on completed tasks</span>
              </article>
            </section>

            <section className="dashboard-active-project">
              <div className="dashboard-active-heading">
                <div>
                  <p className="eyebrow">ACTIVE PROJECT</p>
                  <h2>{activeProject.title}</h2>
                  <p className="subtitle">
                    {activeProject.description || "No project description provided."}
                  </p>
                </div>
                <div className="dashboard-active-actions">
                  <span className="dashboard-deadline">
                    <CalendarDays size={16} />
                    Deadline: {toDateInputValue(activeProject.deadline) || "Not set"}
                  </span>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={openEditProject}
                  >
                    <Pencil size={16} /> Edit project
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setLoading(true);
                      setError("");
                      setProjectRefreshKey((current) => current + 1);
                      if (activeProject?.id) {
                        setTasksLoading(true);
                        setTasksRefreshKey((current) => current + 1);
                      }
                    }}
                    disabled={tasksLoading}
                  >
                    <RefreshCw size={16} /> Refresh
                  </button>
                </div>
              </div>

              <div className="dashboard-health-grid">
                <article className="dashboard-health-card dashboard-progress-card">
                  <div className="dashboard-health-heading">
                    <div className="dashboard-kpi-icon pink">
                      <CheckCircle2 size={19} />
                    </div>
                    <div>
                      <span className="eyebrow">DELIVERY HEALTH</span>
                      <h3>Task completion</h3>
                    </div>
                    <strong>{tasksLoading ? "..." : `${progress}%`}</strong>
                  </div>
                  <div
                    className="dashboard-health-progress"
                    role="progressbar"
                    aria-label="Project task completion"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={tasksLoading ? undefined : progress}
                  >
                    <span
                      style={{
                        width: tasksLoading ? "0%" : `${progress}%`,
                      }}
                    />
                  </div>
                  <p className="subtitle">
                    {tasksLoading
                      ? "Loading project tasks..."
                      : `${completedTasks} of ${tasks.length} tasks completed`}
                  </p>
                </article>

                <article className="dashboard-health-card">
                  <div className="dashboard-health-heading">
                    <div className="dashboard-kpi-icon blue">
                      <ShieldAlert size={19} />
                    </div>
                    <div>
                      <span className="eyebrow">RISK OVERVIEW</span>
                      <h3>Task risk levels</h3>
                    </div>
                  </div>
                  {reportRisks?.riskSummary ? (
                    <div className="dashboard-risk-summary">
                      <span><i className="risk-dot high" /> High <strong>{reportRisks.riskSummary.high}</strong></span>
                      <span><i className="risk-dot medium" /> Medium <strong>{reportRisks.riskSummary.medium}</strong></span>
                      <span><i className="risk-dot low" /> Low <strong>{reportRisks.riskSummary.low}</strong></span>
                    </div>
                  ) : (
                    <p className="subtitle">
                      Risk summary is not available for this project yet.
                    </p>
                  )}
                </article>
              </div>

              <section className="dashboard-task-summary">
                <div className="dashboard-section-heading">
                  <div>
                    <p className="eyebrow">TASK SUMMARY</p>
                    <h3>Project tasks</h3>
                  </div>
                  <span className="dashboard-task-count">
                    {tasksLoading ? "Loading..." : `${tasks.length} total`}
                  </span>
                </div>
                {tasksLoading ? (
                  <p className="subtitle">Loading tasks for this project...</p>
                ) : tasks.length === 0 ? (
                  <p className="subtitle">No tasks have been added to this project yet.</p>
                ) : (
                  <ul className="dashboard-task-list">
                    {tasks.slice(0, 4).map((task) => (
                      <li key={task.id}>
                        <span>
                          <span className="dashboard-task-marker" />
                          {task.title}
                        </span>
                        <span className="dashboard-task-status">
                          {task.status || "Not Started"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </section>

            <ProjectReport
              project={activeProject}
              tasks={tasks}
              cpm={reportCpm}
              risks={reportRisks}
              history={reportHistory}
            />
          </>
        ) : (
          <div className="dashboard-empty-state">
            {error && projects.length === 0 ? (
              <AlertCircle size={24} />
            ) : (
              <FolderKanban size={24} />
            )}
            <h2>
              {error && projects.length === 0
                ? "Projects could not be loaded"
                : projects.length
                  ? "No matching projects"
                  : "No projects yet"}
            </h2>
            <p className="subtitle">
              {error && projects.length === 0
                ? "Retry the request to load your project workspace."
                : projects.length
                  ? "Adjust your search to see another project."
                  : "Create your first project to see its work and delivery progress here."}
            </p>
            {error && projects.length === 0 ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setLoading(true);
                  setProjectRefreshKey((current) => current + 1);
                }}
              >
                <RefreshCw size={16} /> Retry
              </button>
            ) : projects.length === 0 ? (
              <button
                type="button"
                className="primary-button"
                onClick={openCreateProject}
              >
                New project
              </button>
            ) : null}
          </div>
        )}

        {projectModalOpen && (
          <div className="modal-overlay">
            <div
              className="modal-card project-form-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dashboard-project-modal-title"
            >
              <p className="eyebrow">PROJECT DETAILS</p>
              <h2 id="dashboard-project-modal-title">
                {editingProject ? "Edit project" : "Create a project"}
              </h2>

              <form onSubmit={saveProject}>
                <div className="form-group">
                  <label htmlFor="project-title">Project title</label>
                  <input
                    id="project-title"
                    required
                    value={projectForm.title}
                    onChange={(event) =>
                      setProjectForm({
                        ...projectForm,
                        title: event.target.value,
                      })
                    }
                    placeholder="Enter project title"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="project-description">Description</label>
                  <textarea
                    id="project-description"
                    value={projectForm.description}
                    onChange={(event) =>
                      setProjectForm({
                        ...projectForm,
                        description: event.target.value,
                      })
                    }
                    placeholder="Project description"
                  />
                </div>

                <div className="project-date-fields">
                  <div className="form-group">
                    <label htmlFor="project-start">Start date</label>
                    <input
                      id="project-start"
                      type="date"
                      value={projectForm.startDate}
                      onChange={(event) =>
                        setProjectForm({
                          ...projectForm,
                          startDate: event.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="project-deadline">Deadline</label>
                    <input
                      id="project-deadline"
                      type="date"
                      value={projectForm.deadline}
                      onChange={(event) =>
                        setProjectForm({
                          ...projectForm,
                          deadline: event.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {error && (
                  <div className="phase2-alert" role="alert">
                    {error}
                  </div>
                )}
                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setProjectModalOpen(false);
                      setEditingProject(null);
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingProject
                        ? "Save changes"
                        : "Create project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Dashboard;