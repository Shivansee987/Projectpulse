
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
import RiskPanel from "../components/dashboard/RiskPanel";
import WhatIfSimulation from "../components/dashboard/WhatIfSimulation";

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

  // LOAD PROJECTS
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

  // LOAD TASKS
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

  // DASHBOARD STATISTICS
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

  // CREATE PROJECT
  const openCreateProject = () => {
    setEditingProject(null);
    setProjectForm(emptyProjectForm);
    setProjectModalOpen(true);
  };

  // EDIT PROJECT
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

  // SAVE PROJECT
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

  // CREATE TASK
  const openCreateTask = () => {
    setEditingTask(null);
    setTaskForm(emptyTaskForm);
    setTaskModalOpen(true);
  };

  // EDIT TASK
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

  // SAVE TASK
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

        {/* DASHBOARD HEADER */}
        <div className="glass-panel" style={{ padding: 28 }}>
          <p className="eyebrow">PROJECTPULSE WORKSPACE</p>

          <h1 style={{ marginTop: 8, fontSize: "2rem" }}>
            Project Dashboard
          </h1>

          <p className="subtitle" style={{ marginTop: 8 }}>
            Manage your projects, tasks and delivery progress.
          </p>

          {error && (
            <div style={{ marginTop: 20, color: "#dc6666" }}>
              <AlertCircle size={16} style={{ verticalAlign: "middle" }} />
              {" "}{error}
            </div>
          )}

          <div style={{ marginTop: 28 }}>
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

            {searchQuery && filteredProjects.length === 0 && (
              <p className="subtitle" style={{ marginTop: 8 }}>
                No matching projects found.
              </p>
            )}
          </div>
        </div>

        {activeProject ? (
          <>
            {/* STATISTICS */}
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
                  TOTAL DURATION
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

            {/* ACTIVE PROJECT */}
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

                  <h2 style={{ marginTop: 8 }}>
                    {activeProject.title}
                  </h2>

                  <p className="subtitle">
                    {activeProject.description || "No project description"}
                  </p>

                  {activeProject.deadline && (
                    <p className="subtitle" style={{ marginTop: 8 }}>
                      Deadline: {toDateInputValue(activeProject.deadline)}
                    </p>
                  )}
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
                    onClick={() => loadTasks(activeProject.id)}
                    disabled={tasksLoading}
                  >
                    <RefreshCw size={16} /> Refresh
                  </button>
                </div>
              </div>

              <div
                style={{
                  height: 9,
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
                {progress}% tasks completed
              </p>
            </div>

            {/* PROJECT TASKS */}
            <div
              className="glass-panel"
              style={{ padding: 24, marginTop: 20 }}
            >
              <div>
                <p className="eyebrow">WORK MANAGEMENT</p>
                <h2 style={{ marginTop: 8 }}>Project Tasks</h2>
                <p className="subtitle" style={{ marginTop: 6 }}>
                  Update, edit and manage your project tasks.
                </p>
              </div>

              {tasksLoading ? (
                <p style={{ marginTop: 24 }}>Loading tasks...</p>
              ) : filteredTasks.length === 0 ? (
                <p style={{ marginTop: 24 }}>
                  {searchQuery
                    ? "No tasks match your search."
                    : "No tasks yet. Use New Task in the top navigation to add one."}
                </p>
              ) : (
                <div style={{ overflowX: "auto", marginTop: 20 }}>
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
                                gap: 8,
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

            {/* DEPENDENCY GRAPH */}
            <DependencyGraph tasks={tasks} />

            {/* CRITICAL PATH */}
            <CriticalPath projectId={activeProject.id} />

            {/* RISK ANALYSIS */}
            <RiskPanel projectId={activeProject.id} />

            {/* WHAT-IF SIMULATION */}
            <WhatIfSimulation
              projectId={activeProject.id}
              tasks={tasks}
            />
          </>
        ) : (
          <div
            className="glass-panel"
            style={{ padding: 32, marginTop: 20 }}
          >
            <h2>No projects found</h2>

            <p className="subtitle" style={{ marginTop: 8 }}>
              Use the New Project button in the top navigation to create
              your first project.
            </p>
          </div>
        )}

        {/* CREATE / EDIT PROJECT MODAL */}
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

        {/* CREATE / EDIT TASK MODAL */}
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
