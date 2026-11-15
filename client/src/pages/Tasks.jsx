
import { useEffect, useState } from "react";
import { Plus, RefreshCw, Pencil, Trash2, ListTodo } from "lucide-react";
import Layout from "../components/layout/Layout";
import api from "../services/api";

const emptyForm = {
  title: "",
  duration: 1,
  assignee: "",
  status: "Not Started",
};

function Tasks() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingTask, setEditingTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadProjects = async () => {
    try {
      const response = await api.get("/projects");
      const list = response.data.projects || response.data;
      setProjects(list);

      if (list.length > 0) {
        setProjectId((current) =>
          list.some((p) => p.id === current) ? current : list[0].id
        );
      } else {
        setProjectId("");
        setTasks([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not load projects.");
    }
  };

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
    } catch (err) {
      setError(err.response?.data?.message || "Could not load tasks.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const openCreate = () => {
    setEditingTask(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title || "",
      duration: task.duration || 1,
      assignee: task.assignee || "",
      status: task.status || "Not Started",
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
      };

      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, payload);
      } else {
        await api.post("/tasks", { ...payload, projectId });
      }

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
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete task.");
    }
  };

  const updateStatus = async (task, status) => {
    try {
      setError("");
      await api.put(`/tasks/${task.id}`, { status });
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update status.");
    }
  };

  return (
    <Layout activeTab="task-list" setActiveTab={() => {}}>
      <div className="page-shell">
        <div className="glass-panel" style={{ padding: 28 }}>
          <p className="eyebrow">WORK MANAGEMENT</p>
          <h1 style={{ marginTop: 8, fontSize: "2.2rem" }}>Task List</h1>
          <p className="subtitle" style={{ marginTop: 8 }}>
            Create, assign, update and track your project tasks.
          </p>

          {error && (
            <p style={{ color: "#dc6666", marginTop: 16 }}>{error}</p>
          )}

          <div style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 24,
            alignItems: "center"
          }}>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              style={{ padding: 12, borderRadius: 8, minWidth: 220 }}
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

            <button
              type="button"
              className="secondary-button"
              onClick={loadTasks}
              disabled={loading}
            >
              <RefreshCw size={16} /> Refresh
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={openCreate}
              disabled={!projectId}
            >
              <Plus size={16} /> Add Task
            </button>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 24, marginTop: 20 }}>
          <h2 style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <ListTodo size={21} /> Project Tasks ({tasks.length})
          </h2>

          {loading ? (
            <p style={{ marginTop: 20 }}>Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="subtitle" style={{ marginTop: 20 }}>
              No tasks found for this project. Click Add Task to create one.
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
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td style={{ padding: 12 }}>{task.title}</td>
                      <td style={{ padding: 12 }}>
                        {task.assignee || "Unassigned"}
                      </td>
                      <td style={{ padding: 12 }}>{task.duration} days</td>
                      <td style={{ padding: 12 }}>
                        <select
                          value={task.status || "Not Started"}
                          onChange={(e) => updateStatus(task, e.target.value)}
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
                      <td style={{ padding: 12, textAlign: "right" }}>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => openEdit(task)}
                          title="Edit task"
                        >
                          <Pencil size={15} />
                        </button>
                        {" "}
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => deleteTask(task)}
                          title="Delete task"
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
        </div>

        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>{editingTask ? "Edit Task" : "Add New Task"}</h2>

              <form onSubmit={saveTask}>
                <div className="form-group">
                  <label>Task title</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="Enter task title"
                  />
                </div>

                <div className="form-group">
                  <label>Duration (days)</label>
                  <input
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
                  <label>Assignee</label>
                  <input
                    value={form.assignee}
                    onChange={(e) =>
                      setForm({ ...form, assignee: e.target.value })
                    }
                    placeholder="Assignee name"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
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
