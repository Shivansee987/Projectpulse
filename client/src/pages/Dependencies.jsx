
import { useEffect, useState } from "react";
import { AlertCircle, GitBranch, LoaderCircle } from "lucide-react";

import Layout from "../components/layout/Layout";
import DependencyGraph from "../components/dashboard/DependencyGraph";
import api from "../services/api";
import {
  ACTIVE_PROJECT_CHANGE_EVENT,
  getActiveProjectId,
  selectActiveProject,
  syncActiveProject,
} from "../utils/activeProject";

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
        if (!Array.isArray(list)) {
          throw new Error("The project response was not a list.");
        }
        setProjects(list);

        const savedId = getActiveProjectId();
        const selectedProject = list.find(
          (project) => project.id === savedId
        ) || list[0];

        if (selectedProject) {
          setProjectId(selectedProject.id);
        }
        selectActiveProject(selectedProject || null);
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
    const project = projects.find((item) => item.id === id) || null;
    selectActiveProject(project);
  }

  return (
    <Layout activeTab="dependencies" setActiveTab={() => {}}>
      <div className="page-shell phase3-page dependencies-page">
        <style>{`
          .dependencies-page {
            --phase3-highlight: var(--color-pink);
            --phase3-surface: var(--panel);
            --phase3-border: var(--line);
            --phase3-text: var(--text);
            --phase3-muted: var(--text-soft);
          }

          .dependencies-hero,
          .dependencies-state {
            border: 1px solid var(--phase3-border);
            border-radius: var(--radius-xl);
            background: var(--phase3-surface);
            color: var(--phase3-text);
            box-shadow: var(--card-shadow);
          }

          .dependencies-hero {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 24px;
            padding: clamp(20px, 4vw, 34px);
          }

          .dependencies-title {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-top: 12px;
          }

          .dependencies-title h1 {
            font-size: clamp(1.8rem, 3vw, 2.45rem);
            line-height: 1.15;
            letter-spacing: -0.04em;
          }

          .dependencies-title-icon {
            display: grid;
            flex: 0 0 50px;
            width: 50px;
            height: 50px;
            place-items: center;
            border-radius: 16px;
            background: var(--phase3-highlight);
            color: var(--color-navy);
          }

          .dependencies-description {
            max-width: 600px;
            margin-top: 10px;
            color: var(--phase3-muted);
          }

          .dependencies-project-picker {
            display: grid;
            gap: 7px;
            width: min(100%, 300px);
            flex: 0 1 270px;
          }

          .dependencies-project-picker label {
            color: var(--phase3-muted);
            font-size: 0.75rem;
            font-weight: 750;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .dependencies-project-picker select {
            width: 100%;
            min-width: 0;
            padding: 12px 14px;
            border: 1px solid var(--input-border);
            border-radius: var(--radius-md);
            background: var(--input-bg);
            color: var(--phase3-text);
          }

          .dependencies-state {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 18px;
            padding: 20px;
            color: var(--phase3-muted);
          }

          .dependencies-state.error {
            border-color: rgba(180, 35, 64, 0.3);
            color: #a51d39;
          }

          :root[data-theme="dark"] .dependencies-state.error {
            color: #ff9aab;
          }

          .dependencies-state svg {
            flex-shrink: 0;
          }

          @media (max-width: 720px) {
            .dependencies-hero {
              align-items: stretch;
              flex-direction: column;
              gap: 20px;
            }

            .dependencies-project-picker {
              width: 100%;
              flex-basis: auto;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .dependencies-page *,
            .dependencies-page *::before,
            .dependencies-page *::after {
              scroll-behavior: auto !important;
              animation-duration: 0.01ms !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}</style>

        <header className="dependencies-hero">
          <div>
            <p className="eyebrow">WORKFLOW MANAGEMENT</p>
            <div className="dependencies-title">
              <span className="dependencies-title-icon" aria-hidden="true">
                <GitBranch size={25} />
              </span>
              <h1>Dependencies</h1>
            </div>
            <p className="dependencies-description">
              Map task prerequisites, understand delivery order, and keep the
              critical path visible.
            </p>
          </div>

          <div className="dependencies-project-picker">
            <label htmlFor="dependency-project">Project workspace</label>
            <select
              id="dependency-project"
              value={projectId}
              onChange={handleProjectChange}
              disabled={loadingProjects || projects.length === 0}
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
        </header>

        {error && (
          <div className="dependencies-state error" role="alert">
            <AlertCircle size={19} />
            {error}
          </div>
        )}

        {loadingProjects || loadingTasks ? (
          <div className="dependencies-state" role="status" aria-live="polite">
            <LoaderCircle size={19} className="animate-spin" />
            Loading project tasks...
          </div>
        ) : !projectId ? (
          <div className="dependencies-state">
            No project available. Create a project first.
          </div>
        ) : tasks.length < 2 ? (
          <div className="dependencies-state">
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
