import { useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  RefreshCw,
  CheckCircle2,
  Clock3,
  ListTodo,
  Pencil,
  AlertCircle,
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

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/projects");
      const list = response.data.projects || response.data;

      setProjects(list);

      if (list.length > 0) {
        setActiveProject((current) =>
          list.find((project) => project.id === current?.id) || list[0]
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
  };

  const loadTasks = async (projectId) => {
    if (!projectId) {
      setTasks([]);
      return;
    }

    try {
      setTasksLoading(true);

      const response = await api.get("/tasks", {
        params: { projectId },
      });

      const list = response.data.tasks || response.data;
      setTasks(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.response?.data?.message || "Tasks could not be loaded.");
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (activeProject?.id) {
      loadTasks(activeProject.id);
    } else {
      setTasks([]);
    }
  }, [activeProject?.id]);

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
    onProjectModalOpen: openCreateProject,
    onSearch: setSearchQuery,
  };

  if (loading) {
    return (
      <Layout {...layoutProps}>
        <div className="page-shell">
          <p>Loading ProjectPulse...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout {...layoutProps}>
      <div className="page-shell">
        <div className="glass-panel" style={{ padding: 28 }}>
          <p className="eyebrow">PROJECTPULSE WORKSPACE</p>

          <h1 style={{ marginTop: 8, fontSize: "2rem" }}>
            Project Overview
          </h1>

          <p className="subtitle" style={{ marginTop: 8 }}>
            A summary of your selected project and its delivery progress.
          </p>

          {error && (
            <p style={{ color: "#dc6666", marginTop: 16 }}>
              <AlertCircle size={16} style={{ verticalAlign: "middle" }} />
              {" "}{error}
            </p>
          )}

          <div style={{ marginTop: 25 }}>
            <label className="eyebrow" htmlFor="project-selector">
              SELECT PROJECT
            </label>

            <select
              id="project-selector"
              value={activeProject?.id || ""}
              onChange={(event) => {
                const selected = projects.find(
                  (project) => project.id === event.target.value
                );
                setActiveProject(selected || null);
              }}
              style={{
                display: "block",
                width: "100%",
                maxWidth: 420,
                padding: 12,
                marginTop: 8,
                borderRadius: 10,
              }}
            >
              <option value="">Choose a project</option>

              {filteredProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeProject ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 16,
                marginTop: 20,
              }}
            >
              <div className="glass-panel" style={{ padding: 22 }}>
                <FolderKanban size={22} />
                <p className="eyebrow" style={{ marginTop: 14 }}>
                  TOTAL TASKS
                </p>
                <h2>{tasks.length}</h2>
              </div>

              <div className="glass-panel" style={{ padding: 22 }}>
                <CheckCircle2 size={22} />
                <p className="eyebrow" style={{ marginTop: 14 }}>
                  COMPLETED
                </p>
                <h2>{completedTasks}</h2>
              </div>

              <div className="glass-panel" style={{ padding: 22 }}>
                <Clock3 size={22} />
                <p className="eyebrow" style={{ marginTop: 14 }}>
                  TOTAL TASK DURATION
                </p>
                <h2>{totalDuration} days</h2>
              </div>

              <div className="glass-panel" style={{ padding: 22 }}>
                <ListTodo size={22} />
                <p className="eyebrow" style={{ marginTop: 14 }}>
                  PROJECT PROGRESS
                </p>
                <h2>{progress}%</h2>
              </div>
            </div>

            <div
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
                  <p className="eyebrow">ACTIVE PROJECT</p>
                  <h2 style={{ marginTop: 8 }}>{activeProject.title}</h2>

                  <p className="subtitle">
                    {activeProject.description || "No project description"}
                  </p>

                  <p className="subtitle" style={{ marginTop: 8 }}>
                    Deadline: {toDateInputValue(activeProject.deadline) || "Not set"}
                  </p>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={openEditProject}
                  >
                    <Pencil size={16} /> Edit Project
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      loadProjects();
                      if (activeProject?.id) loadTasks(activeProject.id);
                    }}
                    disabled={tasksLoading}
                  >
                    <RefreshCw size={16} /> Refresh
                  </button>
                </div>
              </div>

              <div
                style={{
                  height: 10,
                  background: "rgba(128,128,128,0.2)",
                  borderRadius: 20,
                  marginTop: 22,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: "#35a879",
                    borderRadius: 20,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>

              <p className="subtitle" style={{ marginTop: 8 }}>
                {tasksLoading
                  ? "Refreshing project tasks..."
                  : `${completedTasks} of ${tasks.length} tasks completed`}
              </p>
            </div>

            <ProjectReport
              project={activeProject}
              tasks={tasks}
              cpm={reportCpm}
              risks={reportRisks}
              history={reportHistory}
            />
          </>
        ) : (
          <div
            className="glass-panel"
            style={{ padding: 32, marginTop: 20 }}
          >
            <h2>No projects found</h2>
            <p className="subtitle" style={{ marginTop: 8 }}>
              Use the New Project button to create your first project.
            </p>
          </div>
        )}

        {projectModalOpen && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>{editingProject ? "Edit Project" : "Create New Project"}</h2>

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
                    {saving ? "Saving..." : "Save Project"}
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