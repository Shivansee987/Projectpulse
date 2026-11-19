import { useEffect, useState } from "react";
import {
  CalendarDays,
  FolderKanban,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";
import Layout from "../components/layout/Layout";
import api from "../services/api";
import { emitProjectsLoaded } from "../utils/activeProject";

const emptyProjectForm = {
  title: "",
  description: "",
  startDate: "",
  deadline: "",
};

function toDateInputValue(value) {
  return value ? String(value).slice(0, 10) : "";
}

function formatDate(value) {
  if (!value) return "Not set";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString();
}

function getProjectStatus(project, summary) {
  if (!summary) return "Progress unavailable";
  if (summary.total === 0) return "Planning";
  if (summary.completed === summary.total) return "Completed";

  const deadline = project.deadline
    ? String(project.deadline).slice(0, 10)
    : "";
  const today = new Date().toISOString().slice(0, 10);
  if (deadline && deadline < today) {
    return "Past deadline";
  }

  return "In progress";
}

async function fetchProjectOverview() {
  const response = await api.get("/projects");
  const projects = response.data.projects || response.data;
  if (!Array.isArray(projects)) {
    throw new Error("The project response was not a list.");
  }
  emitProjectsLoaded(projects);

  const results = await Promise.allSettled(
    projects.map(async (project) => {
      if (Number(project._count?.tasks) === 0) {
        return { projectId: project.id, total: 0, completed: 0 };
      }

      const taskResponse = await api.get("/tasks", {
        params: { projectId: project.id },
      });
      const tasks = taskResponse.data.tasks || taskResponse.data;
      if (!Array.isArray(tasks)) {
        throw new Error("The task response was not a list.");
      }

      return {
        projectId: project.id,
        total: tasks.length,
        completed: tasks.filter((task) =>
          ["completed", "done"].includes(
            String(task.status || "").toLowerCase()
          )
        ).length,
      };
    })
  );

  const projectStats = {};
  let failedProjects = 0;
  results.forEach((result) => {
    if (result.status === "fulfilled") {
      const { projectId, total, completed } = result.value;
      projectStats[projectId] = { total, completed };
    } else {
      failedProjects += 1;
    }
  });

  return {
    projects,
    projectStats,
    progressWarning:
      failedProjects > 0
        ? `Progress could not be loaded for ${failedProjects} ${
            failedProjects === 1 ? "project" : "projects"
          }.`
        : "",
  };
}

function Projects() {
  const [projects, setProjects] = useState([]);
  const [projectStats, setProjectStats] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [progressWarning, setProgressWarning] = useState("");
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      try {
        setLoading(true);
        setError("");
        setProgressWarning("");

        const overview = await fetchProjectOverview();
        if (cancelled) return;
        setProjects(overview.projects);
        setProjectStats(overview.projectStats);
        setProgressWarning(overview.progressWarning);
      } catch (err) {
        if (cancelled) return;
        setError(
          err.response?.data?.message || err.message || "Projects could not be loaded."
        );
        setProjects([]);
        setProjectStats({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const visibleProjects = projects.filter((project) =>
    String(project.title || "")
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase())
  );

  const openCreateProject = () => {
    setEditingProject(null);
    setProjectForm(emptyProjectForm);
    setProjectModalOpen(true);
  };

  const openEditProject = (project) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title || "",
      description: project.description || "",
      startDate: toDateInputValue(project.startDate),
      deadline: toDateInputValue(project.deadline),
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
        const updatedProject = response.data.project || response.data;
        setProjects((current) =>
          current.map((project) =>
            project.id === updatedProject.id ? updatedProject : project
          )
        );
      } else {
        const response = await api.post("/projects", projectForm);
        const createdProject = response.data.project || response.data;
        setProjects((current) => [...current, createdProject]);
        setProjectStats((current) => ({
          ...current,
          [createdProject.id]: { total: 0, completed: 0 },
        }));
      }

      setProjectModalOpen(false);
      setEditingProject(null);
      setProjectForm(emptyProjectForm);

      try {
        const overview = await fetchProjectOverview();
        setProjects(overview.projects);
        setProjectStats(overview.projectStats);
        setProgressWarning(overview.progressWarning);
      } catch (refreshError) {
        setError(
          refreshError.response?.data?.message ||
            "Project saved, but the project list could not be refreshed."
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Project could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout activeTab="projects" setActiveTab={() => {}}>
      <div className="page-shell projects-page">
        <section className="projects-hero">
          <div>
            <p className="eyebrow">YOUR PORTFOLIO</p>
            <h1>Projects, moving forward.</h1>
            <p className="subtitle">
              Keep your work organized and see delivery progress across your projects.
            </p>
          </div>
          <button
            type="button"
            className="primary-button projects-create-button"
            onClick={openCreateProject}
          >
            <Plus size={17} /> New project
          </button>
        </section>

        {error && (
          <div className="phase2-alert" role="alert">
            {error}
          </div>
        )}
        {progressWarning && !error && (
          <div className="phase2-warning" role="status">
            {progressWarning} Project details are still available.
          </div>
        )}

        <section className="projects-toolbar" aria-label="Project tools">
          <div>
            <span className="eyebrow">PROJECT WORKSPACE</span>
            <h2>{projects.length} {projects.length === 1 ? "project" : "projects"}</h2>
          </div>
          <label className="projects-search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search projects"
              aria-label="Search projects by title"
            />
          </label>
        </section>

        {loading ? (
          <div className="phase2-loading" role="status">
            Loading your projects...
          </div>
        ) : error && projects.length === 0 ? (
          <div className="projects-empty-state">
            <h2>Projects could not be displayed</h2>
            <p className="subtitle">Retry the request to load your portfolio.</p>
            <button
              type="button"
              className="primary-button"
              onClick={() => setRefreshKey((current) => current + 1)}
            >
              Retry
            </button>
          </div>
        ) : visibleProjects.length === 0 ? (
          <div className="projects-empty-state">
            <div className="projects-empty-icon">
              <FolderKanban size={25} />
            </div>
            <h2>{projects.length ? "No matching projects" : "Your next project starts here"}</h2>
            <p className="subtitle">
              {projects.length
                ? "Try another title or clear your search."
                : "Create a project to organize tasks, track progress and plan delivery."}
            </p>
            {projects.length === 0 && (
              <button
                type="button"
                className="primary-button"
                onClick={openCreateProject}
              >
                <Plus size={17} /> Create your first project
              </button>
            )}
          </div>
        ) : (
          <div className="projects-grid">
            {visibleProjects.map((project) => {
              const summary = projectStats[project.id];
              const progress = summary?.total
                ? Math.round((summary.completed / summary.total) * 100)
                : 0;
              const status = getProjectStatus(project, summary);
              const statusClass = status.toLowerCase().replace(/\s+/g, "-");

              return (
                <article className="project-overview-card" key={project.id}>
                  <div className="project-card-topline">
                    <div className="project-card-icon">
                      <FolderKanban size={20} />
                    </div>
                    <span className={`project-status-pill ${statusClass}`}>
                      {status}
                    </span>
                  </div>

                  <h3>{project.title}</h3>
                  <p className="project-card-description">
                    {project.description || "No description provided."}
                  </p>

                  <div className="project-card-dates">
                    <span>
                      <CalendarDays size={15} />
                      Deadline: {formatDate(project.deadline)}
                    </span>
                    <span>
                      {summary
                        ? `${summary.completed} of ${summary.total} tasks complete`
                        : "Task progress unavailable"}
                    </span>
                  </div>

                  <div
                    className="project-progress-track"
                    role="progressbar"
                    aria-label={`${project.title} task completion`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={summary ? progress : undefined}
                    aria-valuetext={
                      summary
                        ? `${progress}% complete`
                        : "Progress unavailable"
                    }
                  >
                    {summary && (
                      <span style={{ width: `${progress}%` }} />
                    )}
                  </div>

                  <div className="project-card-footer">
                    <span>
                      {summary
                        ? `${summary.total} ${summary.total === 1 ? "task" : "tasks"}`
                        : project._count?.tasks !== undefined
                          ? `${project._count.tasks} tasks`
                          : "Task count unavailable"}
                    </span>
                    <button
                      type="button"
                      className="secondary-button project-edit-button"
                      onClick={() => openEditProject(project)}
                      aria-label={`Edit ${project.title}`}
                    >
                      <Pencil size={15} /> Edit
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {projectModalOpen && (
          <div className="modal-overlay">
            <div
              className="modal-card project-form-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="project-modal-title"
            >
              <div className="project-modal-heading">
                <div>
                  <p className="eyebrow">PROJECT DETAILS</p>
                  <h2 id="project-modal-title">
                    {editingProject ? "Edit project" : "Create a project"}
                  </h2>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setProjectModalOpen(false)}
                  aria-label="Close project form"
                >
                  <X size={19} />
                </button>
              </div>

              <form onSubmit={saveProject}>
                <div className="form-group">
                  <label htmlFor="projects-title">Project title</label>
                  <input
                    id="projects-title"
                    required
                    value={projectForm.title}
                    onChange={(event) =>
                      setProjectForm({ ...projectForm, title: event.target.value })
                    }
                    placeholder="Enter project title"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="projects-description">Description</label>
                  <textarea
                    id="projects-description"
                    value={projectForm.description}
                    onChange={(event) =>
                      setProjectForm({
                        ...projectForm,
                        description: event.target.value,
                      })
                    }
                    placeholder="Add a short project description"
                  />
                </div>
                <div className="project-date-fields">
                  <div className="form-group">
                    <label htmlFor="projects-start-date">Start date</label>
                    <input
                      id="projects-start-date"
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
                    <label htmlFor="projects-deadline">Deadline</label>
                    <input
                      id="projects-deadline"
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
                    onClick={() => setProjectModalOpen(false)}
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

export default Projects;
