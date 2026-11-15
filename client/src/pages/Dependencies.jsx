
import { useEffect, useState } from "react";
import { GitBranch } from "lucide-react";

import Layout from "../components/layout/Layout";
import DependencyGraph from "../components/dashboard/DependencyGraph";
import api from "../services/api";

function Dependencies() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await api.get("/projects");
        const list = response.data.projects || response.data;
        setProjects(list);

        const savedId = localStorage.getItem("activeProjectId");
        const selectedProject = list.find(
          (project) => project.id === savedId
        ) || list[0];

        if (selectedProject) {
          setProjectId(selectedProject.id);
          localStorage.setItem("activeProjectId", selectedProject.id);
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "Could not load projects."
        );
      } finally {
        setLoadingProjects(false);
      }
    }

    loadProjects();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      if (!projectId) {
        setTasks([]);
        return;
      }

      try {
        setLoadingTasks(true);
        setError("");

        const response = await api.get("/tasks", {
          params: { projectId },
        });

        const list = response.data.tasks || response.data;

        if (!cancelled) {
          setTasks(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message || "Could not load tasks."
          );
          setTasks([]);
        }
      } finally {
        if (!cancelled) setLoadingTasks(false);
      }
    }

    loadTasks();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  function handleProjectChange(event) {
    const id = event.target.value;
    setProjectId(id);
    localStorage.setItem("activeProjectId", id);
  }

  return (
    <Layout activeTab="dependencies" setActiveTab={() => {}}>
      <div className="page-shell">
        <div className="glass-panel" style={{ padding: 28 }}>
          <p className="eyebrow">WORKFLOW MANAGEMENT</p>

          <h1 style={{ marginTop: 8, fontSize: "2.2rem" }}>
            <GitBranch
              size={28}
              style={{ display: "inline", verticalAlign: "middle" }}
            />{" "}
            Dependencies
          </h1>

          <p className="subtitle" style={{ marginTop: 8 }}>
            Manage task prerequisites and visualize the order of work.
          </p>

          {error && (
            <p style={{ color: "#dc6666", marginTop: 16 }}>{error}</p>
          )}

          <div style={{ marginTop: 22 }}>
            <label
              htmlFor="dependency-project"
              style={{ display: "block", marginBottom: 8 }}
            >
              Select Project
            </label>

            <select
              id="dependency-project"
              value={projectId}
              onChange={handleProjectChange}
              disabled={loadingProjects || projects.length === 0}
              style={{
                padding: 12,
                borderRadius: 8,
                minWidth: 230,
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
        </div>

        {loadingProjects || loadingTasks ? (
          <div className="glass-panel" style={{ padding: 24, marginTop: 20 }}>
            Loading project tasks...
          </div>
        ) : !projectId ? (
          <div className="glass-panel" style={{ padding: 24, marginTop: 20 }}>
            No project available. Create a project first.
          </div>
        ) : tasks.length < 2 ? (
          <div className="glass-panel" style={{ padding: 24, marginTop: 20 }}>
            This project needs at least two tasks before you can create
            dependencies.
          </div>
        ) : (
          <DependencyGraph key={projectId} tasks={tasks} />
        )}
      </div>
    </Layout>
  );
}

export default Dependencies;
