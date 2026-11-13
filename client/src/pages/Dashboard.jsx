
import { useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  RefreshCw,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ListTodo,
  Pencil,
  Trash2,
} from "lucide-react";

import Layout from "../components/layout/Layout";
import api from "../services/api";
import DependencyGraph from "../components/dashboard/DependencyGraph";
import CriticalPath from "../components/dashboard/CriticalPath";

const statusOptions = [
  "Not started",
  "In progress",
  "At risk",
  "Done",
];

const emptyProjectForm = {
  title: "",
  description: "",
  startDate: "",
  deadline: "",
};

const emptyTaskForm = {
  title: "",
  duration: 1,
  assignee: "",
  status: "Not started",
};

function toDateInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function toBackendStatus(status) {
  if (status === "Done") return "Completed";
  if (status === "Not started") return "Not Started";
  return status;
}

function toFrontendStatus(status) {
  if (status === "Completed") return "Done";
  if (status === "Not Started") return "Not started";
  return status;
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);

  const [editingProject, setEditingProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);

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
      setError("");

      const response = await api.get("/tasks", {
        params: { projectId },
      });

      const list = response.data.tasks || response.data;

      setTasks(
        list.map((task) => ({
          ...task,
          status: toFrontendStatus(task.status),
          assignee: task.assignee || "Unassigned",
        }))
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Tasks could not be loaded."
      );
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

  const completedTasks = tasks.filter(
    (task) => task.status === "Done"
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

  const filteredTasks = tasks.filter((task) => {
    const query = searchQuery.toLowerCase();

    return (
      String(task.title || "").toLowerCase().includes(query) ||
      String(task.assignee || "").toLowerCase().includes(query) ||
      String(task.status || "").toLowerCase().includes(query)
    );
  });

  const filteredProjects = projects.filter((project) =>
    String(project.title || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  // CREATE OR UPDATE PROJECT
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

  const handleSaveProject = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (editingProject) {
        const response = await api.put(
          `/projects/${editingProject.id}`,
          projectForm
        );

        const updatedProject =
          response.data.project || response.data;

        setProjects((current) =>
          current.map((project) =>
            project.id === updatedProject.id
              ? updatedProject
              : project
          )
        );

        setActiveProject(updatedProject);
      } else {
        const response = await api.post("/projects", projectForm);

        const newProject =
          response.data.project || response.data;

        setProjects((current) => [...current, newProject]);
        setActiveProject(newProject);
      }

      setProjectForm(emptyProjectForm);
      setEditingProject(null);
      setProjectModalOpen(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Project could not be saved."
      );
    } finally {
      setSaving(false);
    }
  };

  // CREATE OR UPDATE TASK
  const openCreateTask = () => {
    setEditingTask(null);
    setTaskForm(emptyTaskForm);
    setTaskModalOpen(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);

    setTaskForm({
      title: task.title || "",
      duration: task.duration || 1,
      assignee: task.assignee === "Unassigned" ? "" : task.assignee,
      status: task.status || "Not started",
    });

    setTaskModalOpen(true);
  };

  const handleSaveTask = async (event) => {
    event.preventDefault();

    if (!activeProject?.id) return;

    try {
      setSaving(true);
      setError("");

      const payload = {
        title: taskForm.title,
        duration: Number(taskForm.duration),
        assignee: taskForm.assignee || undefined,
        status: toBackendStatus(taskForm.status),
      };

      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, payload);
      } else {
        await api.post("/tasks", {
          ...payload,
          projectId: activeProject.id,
        });
      }

      await loadTasks(activeProject.id);

      setTaskForm(emptyTaskForm);
      setEditingTask(null);
      setTaskModalOpen(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Task could not be saved."
      );
    } finally {
      setSaving(false);
    }
  };

  // DELETE TASK
  const handleDeleteTask = async (task) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(`/tasks/${task.id}`);

      setTasks((current) =>
        current.filter((item) => item.id !== task.id)
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Task could not be deleted."
      );
    }
  };

  // UPDATE TASK STATUS
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setError("");

      await api.put(`/tasks/${taskId}`, {
        status: toBackendStatus(newStatus),
      });

      setTasks((current) =>
        current.map((task) =>
          task.id === taskId
            ? { ...task, status: newStatus }
            : task
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Task status could not be updated."
      );
    }
  };

  const layoutProps = {
    activeTab,
    setActiveTab,
    onTaskModalOpen: openCreateTask,
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

        {/* Dashboard Header */}
        <div className="glass-panel" style={{ padding: "28px" }}>
          <p className="eyebrow">PROJECTPULSE WORKSPACE</p>

          <h1 style={{ marginTop: "8px", fontSize: "2rem" }}>
            Project Dashboard
          </h1>

          <p className="subtitle" style={{ marginTop: "8px" }}>
            Manage your projects, tasks and delivery progress.
          </p>

          {error && (
            <div style={{ marginTop: "20px", color: "#dc6666" }}>
              <AlertCircle size={16} style={{ verticalAlign: "middle" }} />
              {" "}{error}
            </div>
          )}

          <div style={{ marginTop: "28px" }}>
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
                maxWidth: "420px",
                padding: "12px",
                marginTop: "8px",
                borderRadius: "10px",
              }}
            >
              <option value="">Choose a project</option>

              {filteredProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>

            {searchQuery && filteredProjects.length === 0 && (
              <p className="subtitle" style={{ marginTop: "8px" }}>
                No matching projects found.
              </p>
            )}
          </div>
        </div>

        {activeProject ? (
          <>
            {/* Statistics */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
                marginTop: "20px",
              }}
            >
              <div className="glass-panel" style={{ padding: "22px" }}>
                <FolderKanban size={22} />
                <p className="eyebrow" style={{ marginTop: "14px" }}>
                  TOTAL TASKS
                </p>
                <h2>{tasks.length}</h2>
              </div>

              <div className="glass-panel" style={{ padding: "22px" }}>
                <CheckCircle2 size={22} />
                <p className="eyebrow" style={{ marginTop: "14px" }}>
                  COMPLETED
                </p>
                <h2>{completedTasks}</h2>
              </div>

              <div className="glass-panel" style={{ padding: "22px" }}>
                <Clock3 size={22} />
                <p className="eyebrow" style={{ marginTop: "14px" }}>
                  TOTAL DURATION
                </p>
                <h2>{totalDuration} days</h2>
              </div>

              <div className="glass-panel" style={{ padding: "22px" }}>
                <ListTodo size={22} />
                <p className="eyebrow" style={{ marginTop: "14px" }}>
                  PROJECT PROGRESS
                </p>
                <h2>{progress}%</h2>
              </div>
            </div>

            {/* Active Project */}
            <div
              className="glass-panel"
              style={{ padding: "24px", marginTop: "20px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <p className="eyebrow">ACTIVE PROJECT</p>

                  <h2 style={{ marginTop: "8px" }}>
                    {activeProject.title}
                  </h2>

                  <p className="subtitle">
                    {activeProject.description || "No project description"}
                  </p>

                  {activeProject.deadline && (
                    <p className="subtitle" style={{ marginTop: "8px" }}>
                      Deadline: {toDateInputValue(activeProject.deadline)}
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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
                    onClick={() => loadTasks(activeProject.id)}
                    disabled={tasksLoading}
                  >
                    <RefreshCw size={16} /> Refresh
                  </button>
                </div>
              </div>

              <div
                style={{
                  height: "9px",
                  background: "rgba(128,128,128,0.2)",
                  borderRadius: "20px",
                  marginTop: "22px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: "#35a879",
                    borderRadius: "20px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>

              <p className="subtitle" style={{ marginTop: "8px" }}>
                {progress}% tasks completed
              </p>
            </div>

            {/* Tasks */}
            <div
              className="glass-panel"
              style={{ padding: "24px", marginTop: "20px" }}
            >
              <div>
                <p className="eyebrow">WORK MANAGEMENT</p>
                <h2 style={{ marginTop: "8px" }}>Project Tasks</h2>
                <p className="subtitle" style={{ marginTop: "6px" }}>
                  Update, edit and manage your project tasks.
                </p>
              </div>

              {tasksLoading ? (
                <p style={{ marginTop: "24px" }}>Loading tasks...</p>
              ) : filteredTasks.length === 0 ? (
                <p style={{ marginTop: "24px" }}>
                  {searchQuery
                    ? "No tasks match your search."
                    : "No tasks yet. Use New Task in the top navigation to add one."}
                </p>
              ) : (
                <div style={{ overflowX: "auto", marginTop: "20px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th align="left">Task</th>
                        <th align="left">Assignee</th>
                        <th align="left">Duration</th>
                        <th align="left">Status</th>
                        <th align="right">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredTasks.map((task) => (
                        <tr key={task.id}>
                          <td style={{ padding: "14px 8px" }}>
                            <strong>{task.title}</strong>
                          </td>

                          <td style={{ padding: "14px 8px" }}>
                            {task.assignee}
                          </td>

                          <td style={{ padding: "14px 8px" }}>
                            {task.duration} days
                          </td>

                          <td style={{ padding: "14px 8px" }}>
                            <select
                              value={task.status}
                              onChange={(event) =>
                                handleStatusChange(
                                  task.id,
                                  event.target.value
                                )
                              }
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td style={{ padding: "14px 8px", textAlign: "right" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "8px",
                              }}
                            >
                              <button
                                type="button"
                                className="secondary-button"
                                title="Edit task"
                                aria-label={`Edit ${task.title}`}
                                onClick={() => openEditTask(task)}
                              >
                                <Pencil size={15} />
                              </button>

                              <button
                                type="button"
                                className="secondary-button"
                                title="Delete task"
                                aria-label={`Delete ${task.title}`}
                                onClick={() => handleDeleteTask(task)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Dependency Graph */}
            <DependencyGraph tasks={tasks} />

            {/* Critical Path Analysis */}
            <CriticalPath projectId={activeProject.id} />

          </>
        ) : (
          <div
            className="glass-panel"
            style={{ padding: "32px", marginTop: "20px" }}
          >
            <h2>No projects found</h2>

            <p className="subtitle" style={{ marginTop: "8px" }}>
              Use the New Project button in the top navigation to create
              your first project.
            </p>
          </div>
        )}

        {/* Create / Edit Project Modal */}
        {isProjectModalOpen && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>{editingProject ? "Edit Project" : "Create New Project"}</h2>

              <form onSubmit={handleSaveProject}>
                <div className="form-group">
                  <label htmlFor="project-title">Project title</label>
                  <input
                    id="project-title"
                    type="text"
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
                    {saving
                      ? "Saving..."
                      : editingProject
                        ? "Update Project"
                        : "Save Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create / Edit Task Modal */}
        {isTaskModalOpen && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>{editingTask ? "Edit Task" : "Add New Task"}</h2>

              <form onSubmit={handleSaveTask}>
                <div className="form-group">
                  <label htmlFor="task-title">Task title</label>
                  <input
                    id="task-title"
                    type="text"
                    required
                    value={taskForm.title}
                    onChange={(event) =>
                      setTaskForm({
                        ...taskForm,
                        title: event.target.value,
                      })
                    }
                    placeholder="Enter task title"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="task-duration">Duration (days)</label>
                  <input
                    id="task-duration"
                    type="number"
                    min="1"
                    required
                    value={taskForm.duration}
                    onChange={(event) =>
                      setTaskForm({
                        ...taskForm,
                        duration: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="task-assignee">Assignee</label>
                  <input
                    id="task-assignee"
                    type="text"
                    value={taskForm.assignee}
                    onChange={(event) =>
                      setTaskForm({
                        ...taskForm,
                        assignee: event.target.value,
                      })
                    }
                    placeholder="Enter assignee name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="task-status">Status</label>
                  <select
                    id="task-status"
                    value={taskForm.status}
                    onChange={(event) =>
                      setTaskForm({
                        ...taskForm,
                        status: event.target.value,
                      })
                    }
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setTaskModalOpen(false);
                      setEditingTask(null);
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
                      : editingTask
                        ? "Update Task"
                        : "Save Task"}
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

