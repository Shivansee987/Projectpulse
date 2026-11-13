
import { useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ListTodo,
} from "lucide-react";
import Layout from "../components/layout/Layout";
import api from "../services/api";

const statusOptions = [
  "Not started",
  "In progress",
  "At risk",
  "Done",
];

function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);

  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    startDate: "",
    deadline: "",
  });

  const [taskForm, setTaskForm] = useState({
    title: "",
    duration: 1,
    assignee: "",
  });

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
    if (!projectId) return;

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
          status:
            task.status === "Completed"
              ? "Done"
              : task.status === "Not Started"
                ? "Not started"
                : task.status,
          assignee: task.assignee || "Unassigned",
        }))
      );
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

  const handleCreateProject = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const response = await api.post("/projects", projectForm);
      const newProject = response.data.project || response.data;

      setProjects((current) => [...current, newProject]);
      setActiveProject(newProject);

      setProjectForm({
        title: "",
        description: "",
        startDate: "",
        deadline: "",
      });

      setProjectModalOpen(false);
    } catch (err) {
      setError(
        err.response?.data?.message || "Project could not be created."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();

    if (!activeProject?.id) return;

    try {
      setSaving(true);
      setError("");

      await api.post("/tasks", {
        title: taskForm.title,
        duration: Number(taskForm.duration),
        projectId: activeProject.id,
        assignee: taskForm.assignee || undefined,
      });

      await loadTasks(activeProject.id);

      setTaskForm({
        title: "",
        duration: 1,
        assignee: "",
      });

      setTaskModalOpen(false);
    } catch (err) {
      setError(
        err.response?.data?.message || "Task could not be created."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const backendStatus =
      newStatus === "Done"
        ? "Completed"
        : newStatus === "Not started"
          ? "Not Started"
          : newStatus;

    try {
      setError("");

      await api.put(`/tasks/${taskId}`, {
        status: backendStatus,
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
        err.response?.data?.message || "Task status could not be updated."
      );
    }
  };

  const layoutProps = {
    activeTab,
    setActiveTab,
    onTaskModalOpen: () => setTaskModalOpen(true),
    onProjectModalOpen: () => setProjectModalOpen(true),
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <p className="eyebrow">PROJECTPULSE WORKSPACE</p>
              <h1 style={{ marginTop: "8px", fontSize: "2rem" }}>
                Project Dashboard
              </h1>
              <p className="subtitle" style={{ marginTop: "8px" }}>
                Manage your projects, tasks and delivery progress.
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={() => setProjectModalOpen(true)}
            >
              <Plus size={17} /> New Project
            </button>
          </div>

          {error && (
            <div style={{ marginTop: "20px", color: "#dc6666" }}>
              <AlertCircle size={16} style={{ verticalAlign: "middle" }} />
              {" "}{error}
            </div>
          )}

          <div style={{ marginTop: "28px" }}>
            <label className="eyebrow">SELECT PROJECT</label>

            <select
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
                </div>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => loadTasks(activeProject.id)}
                  disabled={tasksLoading}
                >
                  <RefreshCw size={16} /> Refresh
                </button>
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <p className="eyebrow">WORK MANAGEMENT</p>
                  <h2 style={{ marginTop: "8px" }}>Project Tasks</h2>
                </div>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setTaskModalOpen(true)}
                >
                  <Plus size={17} /> Add Task
                </button>
              </div>

              {tasksLoading ? (
                <p style={{ marginTop: "24px" }}>Loading tasks...</p>
              ) : filteredTasks.length === 0 ? (
                <p style={{ marginTop: "24px" }}>
                  {searchQuery
                    ? "No tasks match your search."
                    : "No tasks yet. Add your first task."}
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <div
            className="glass-panel"
            style={{ padding: "32px", marginTop: "20px" }}
          >
            <h2>No projects found</h2>
            <p className="subtitle" style={{ marginTop: "8px" }}>
              Create your first project to start managing tasks.
            </p>

            <button
              type="button"
              className="primary-button"
              style={{ marginTop: "18px" }}
              onClick={() => setProjectModalOpen(true)}
            >
              <Plus size={17} /> Create Project
            </button>
          </div>
        )}

        {/* Create Project Modal */}
        {isProjectModalOpen && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>Create New Project</h2>

              <form onSubmit={handleCreateProject}>
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
                    onClick={() => setProjectModalOpen(false)}
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

        {/* Add Task Modal */}
        {isTaskModalOpen && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>Add New Task</h2>

              <form onSubmit={handleCreateTask}>
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

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setTaskModalOpen(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Task"}
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
