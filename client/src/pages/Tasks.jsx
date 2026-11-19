
import { useEffect, useState } from "react";
import {
  FolderKanban,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  ListTodo,
} from "lucide-react";
import Layout from "../components/layout/Layout";
import api from "../services/api";
import {
  ACTIVE_PROJECT_CHANGE_EVENT,
  getActiveProjectId,
  selectActiveProject,
  syncActiveProject,
} from "../utils/activeProject";

const emptyForm = {
  title: "",
  duration: 1,
  assignee: "",
  status: "Not Started",
  dueDate: "",
  priority: "Medium",
};

function Tasks() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingTask, setEditingTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsLoadFailed, setProjectsLoadFailed] = useState(false);
  const [projectsRefreshKey, setProjectsRefreshKey] = useState(0);
  const [taskLoadFailed, setTaskLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadTasks = async () => {
    if (!projectId) {
      setTasks([]);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await api.get("/tasks", {
        params: { projectId },
      });
      const list = response.data.tasks || response.data;
      setTasks(Array.isArray(list) ? list : []);
      setTaskLoadFailed(false);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load tasks.");
      setTasks([]);
      setTaskLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadProjects() {
      try {
        setProjectsLoading(true);
        setError("");
        const response = await api.get("/projects");
        const list = response.data.projects || response.data;
        if (!Array.isArray(list)) {
          throw new Error("The project response was not a list.");
        }
        setProjects(list);
        setProjectsLoadFailed(false);

        if (list.length > 0) {
          const savedId = getActiveProjectId();
          const selected =
            list.find((project) => project.id === savedId) || list[0];
          setProjectId(selected.id);
          selectActiveProject(selected);
        } else {
          setProjectId("");
          setTasks([]);
          selectActiveProject(null);
        }
      } catch (err) {
        setError(
          err.response?.data?.message || err.message || "Could not load projects."
        );
        setProjectsLoadFailed(true);
      } finally {
        setProjectsLoading(false);
      }
    }

    loadProjects();
  }, [projectsRefreshKey]);

  useEffect(() => {
    function handleActiveProjectChange(event) {
      syncActiveProject(event, setProjects, setProjectId);
      setTasks([]);
      setError("");
    }

    window.addEventListener(
      ACTIVE_PROJECT_CHANGE_EVENT,
      handleActiveProjectChange
    );

    return () =>
      window.removeEventListener(
        ACTIVE_PROJECT_CHANGE_EVENT,
        handleActiveProjectChange
      );
  }, []);

  useEffect(() => {
    if (!projectId) return;

    async function loadProjectTasks() {
      try {
        setLoading(true);
        setError("");
        setTaskLoadFailed(false);
        const response = await api.get("/tasks", {
          params: { projectId },
        });
        const list = response.data.tasks || response.data;
        setTasks(Array.isArray(list) ? list : []);
        setTaskLoadFailed(false);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load tasks.");
        setTasks([]);
        setTaskLoadFailed(true);
      } finally {
        setLoading(false);
      }
    }

    loadProjectTasks();
  }, [projectId]);

  const openCreate = () => {
    setError("");
    setEditingTask(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setError("");
    setEditingTask(task);
    setForm({
      title: task.title || "",
      duration: task.duration || 1,
      assignee: task.assignee || "",
      status: task.status || "Not Started",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      priority: task.priority || "Medium",
    });
    setModalOpen(true);
  };

  const saveTask = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        title: form.title.trim(),
        duration: Number(form.duration),
        assignee: form.assignee.trim() || undefined,
        status: form.status,
        dueDate: form.dueDate || null,
        priority: form.priority,
      };

      const response = editingTask
        ? await api.put(`/tasks/${editingTask.id}`, payload)
        : await api.post("/tasks", { ...payload, projectId });

      window.dispatchEvent(
        new CustomEvent("projectpulse:tasks-updated", {
          detail: { task: response.data.task },
        })
      );
      setModalOpen(false);
      setEditingTask(null);
      setForm(emptyForm);
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save task.");
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;

    try {
      setError("");
      await api.delete(`/tasks/${task.id}`);
      window.dispatchEvent(
        new CustomEvent("projectpulse:tasks-updated", {
          detail: { deletedTaskId: task.id },
        })
      );
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete task.");
    }
  };

  const updateStatus = async (task, status) => {
    try {
      setError("");
      await api.put(`/tasks/${task.id}`, { status });
      window.dispatchEvent(
        new CustomEvent("projectpulse:tasks-updated", {
          detail: { taskId: task.id, status },
        })
      );
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update status.");
    }
  };

  return (
    <Layout activeTab="task-list" setActiveTab={() => {}}>
      <div className="page-shell tasks-page">
        <section className="tasks-hero">
          <div>
            <p className="eyebrow">WORK MANAGEMENT</p>
            <h1>Tasks, made manageable.</h1>
            <p className="subtitle">
              Create, assign and track the work that moves your projects forward.
            </p>
          </div>
          <button
            type="button"
            className="primary-button"
            onClick={openCreate}
            disabled={!projectId || projectsLoading}
          >
            <Plus size={17} /> Add task
          </button>
        </section>

        {error && (
          <div className="phase2-alert" role="alert">
            {error}
          </div>
        )}

        <section className="tasks-toolbar">
          <label className="tasks-project-picker">
            <span className="eyebrow">CURRENT PROJECT</span>
            <select
              aria-label="Select project for task list"
              value={projectId}
              onChange={(event) => {
                const project =
                  projects.find((item) => item.id === event.target.value) ||
                  null;
                selectActiveProject(project);
              }}
              disabled={projectsLoading || projects.length === 0}
            >
              {projects.length === 0 && <option value="">No projects available</option>}
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </label>
          <div className="tasks-toolbar-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={loadTasks}
              disabled={loading || !projectId}
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </section>

        <section className="tasks-list-panel">
          <div className="tasks-list-heading">
            <div>
              <p className="eyebrow">TASK BOARD</p>
              <h2>
                <ListTodo size={21} />
                {projectId
                  ? `Project tasks${loading ? "" : ` (${tasks.length})`}`
                  : "Project tasks"}
              </h2>
            </div>
            {projectId && (
              <span className="tasks-count-pill">
                {projectsLoading || loading ? "Loading" : `${tasks.length} tasks`}
              </span>
            )}
          </div>

          {projectsLoading || loading ? (
            <div className="phase2-loading" role="status">
              {projectsLoading ? "Loading projects..." : "Loading project tasks..."}
            </div>
          ) : projects.length === 0 ? (
            <div className="tasks-empty-state">
              {projectsLoadFailed ? <RefreshCw size={24} /> : <FolderKanban size={24} />}
              <h3>
                {projectsLoadFailed
                  ? "Projects could not be loaded"
                  : "No projects available"}
              </h3>
              <p className="subtitle">
                {projectsLoadFailed
                  ? "Retry the request to load your projects."
                  : "Create a project before adding tasks."}
              </p>
              {projectsLoadFailed && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setProjectsRefreshKey((current) => current + 1)
                  }
                >
                  <RefreshCw size={16} /> Retry
                </button>
              )}
            </div>
          ) : taskLoadFailed ? (
            <div className="tasks-empty-state">
              <RefreshCw size={24} />
              <h3>Tasks could not be loaded</h3>
              <p className="subtitle">
                Retry the request to refresh this project&apos;s tasks.
              </p>
              <button
                type="button"
                className="secondary-button"
                onClick={loadTasks}
              >
                <RefreshCw size={16} /> Retry
              </button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="tasks-empty-state">
              <ListTodo size={24} />
              <h3>No tasks in this project yet</h3>
              <p className="subtitle">
                Add the first task to make a plan and track its status.
              </p>
              <button
                type="button"
                className="primary-button"
                onClick={openCreate}
              >
                <Plus size={17} /> Add task
              </button>
            </div>
          ) : (
            <div className="tasks-table-wrap">
              <table className="task-table">
                <thead>
                  <tr>
                    <th scope="col">Task</th>
                    <th scope="col">Assignee</th>
                    <th scope="col">Duration</th>
                    <th scope="col">Due date</th>
                    <th scope="col">Priority</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="task-actions-heading">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td data-label="Task" className="task-title-cell">
                        <strong>{task.title}</strong>
                      </td>
                      <td data-label="Assignee">
                        {task.assignee || "Unassigned"}
                      </td>
                      <td data-label="Duration">{task.duration} days</td>
                      <td data-label="Due date">
                        {task.dueDate
                          ? new Date(`${task.dueDate.slice(0, 10)}T12:00:00`).toLocaleDateString()
                          : "No due date"}
                      </td>
                      <td data-label="Priority">
                        <span className={`task-priority task-priority-${(task.priority || "Medium").toLowerCase()}`}>
                          {task.priority || "Medium"}
                        </span>
                      </td>
                      <td data-label="Status">
                        <select
                          className="task-status-select"
                          value={task.status || "Not Started"}
                          onChange={(e) => updateStatus(task, e.target.value)}
                          aria-label={`Status for ${task.title}`}
                        >
                          {["Not Started", "In Progress", "At Risk", "Completed"].map(
                            (status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            )
                          )}
                        </select>
                      </td>
                      <td data-label="Actions" className="task-row-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => openEdit(task)}
                          title="Edit task"
                          aria-label={`Edit ${task.title}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => deleteTask(task)}
                          title="Delete task"
                          aria-label={`Delete ${task.title}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {modalOpen && (
          <div className="modal-overlay">
            <div
              className="modal-card task-form-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="task-modal-title"
            >
              <p className="eyebrow">TASK DETAILS</p>
              <h2 id="task-modal-title">
                {editingTask ? "Edit task" : "Add a task"}
              </h2>

              <form onSubmit={saveTask}>
                <div className="form-group">
                  <label htmlFor="task-title">Task title</label>
                  <input
                    id="task-title"
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
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
                    value={form.duration}
                    onChange={(e) =>
                      setForm({ ...form, duration: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="task-assignee">Assignee</label>
                  <input
                    id="task-assignee"
                    value={form.assignee}
                    onChange={(e) =>
                      setForm({ ...form, assignee: e.target.value })
                    }
                    placeholder="Assignee name"
                  />
                </div>

                <div className="task-reminder-fields">
                  <div className="form-group">
                    <label htmlFor="task-due-date">Due date</label>
                    <input
                      id="task-due-date"
                      type="date"
                      value={form.dueDate}
                      onChange={(e) =>
                        setForm({ ...form, dueDate: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="task-priority">Priority</label>
                    <select
                      id="task-priority"
                      value={form.priority}
                      onChange={(e) =>
                        setForm({ ...form, priority: e.target.value })
                      }
                    >
                      {["Critical", "High", "Medium", "Low"].map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="task-status">Status</label>
                  <select
                    id="task-status"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    {["Not Started", "In Progress", "At Risk", "Completed"].map(
                      (status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      )
                    )}
                  </select>
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
                    onClick={() => setModalOpen(false)}
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

export default Tasks;
