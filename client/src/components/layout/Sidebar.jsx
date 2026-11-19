import { useEffect, useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  LayoutGrid,
  ListTodo,
  FolderKanban,
  Moon,
  Sparkles,
  Sun,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { navItems } from "../../data/projectData";
import api from "../../services/api";
import {
  ACTIVE_PROJECT_CHANGE_EVENT,
  PROJECTS_LOADED_EVENT,
  getActiveProjectId,
  selectActiveProject,
  syncActiveProject,
} from "../../utils/activeProject";

const iconMap = {
  overview: LayoutGrid,
  projects: FolderKanban,
  "task-list": ListTodo,
  dependencies: GitBranch,
  simulator: BarChart3,
  insights: Sparkles,
};

const routeMap = {
  overview: "/",
  projects: "/projects",
  "task-list": "/tasks",
  dependencies: "/dependencies",
  simulator: "/simulator",
  insights: "/analytics",
};

function Sidebar({
  sidebarRef,
  activeTab,
  setActiveTab,
  collapsed,
  mobileOpen,
  onCollapseToggle,
  onNavigate,
  theme,
  onToggleTheme,
}) {
  const navigate = useNavigate();
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(
    getActiveProjectId
  );
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [projectsRefreshKey, setProjectsRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      try {
        setProjectsLoading(true);
        setProjectsError("");

        const response = await api.get("/projects");
        const data = response.data.projects || response.data;
        if (!Array.isArray(data)) {
          throw new Error("The project response was not a list.");
        }
        const list = data;

        if (cancelled) return;

        setProjects(list);
        const savedId = getActiveProjectId();
        const selected = list.find((project) => project.id === savedId) || list[0];
        const selectedId = selected?.id || "";

        setSelectedProjectId(selectedId);
        selectActiveProject(selected || null);
      } catch (error) {
        if (!cancelled) {
          setProjectsError(
            error.response?.data?.message ||
              error.message ||
              "Could not load projects."
          );
        }
      } finally {
        if (!cancelled) setProjectsLoading(false);
      }
    }

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, [projectsRefreshKey]);

  useEffect(() => {
    function handleActiveProjectChange(event) {
      if (event.detail?.project) {
        setProjectsError("");
      }
      syncActiveProject(event, setProjects, setSelectedProjectId);
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
    function handleProjectsLoaded(event) {
      const list = event.detail?.projects;
      if (!Array.isArray(list)) return;

      setProjects(list);
      setProjectsError("");

      const savedId = getActiveProjectId();
      const selected = list.find((project) => project.id === savedId) || list[0];
      setSelectedProjectId(selected?.id || "");
      selectActiveProject(selected || null);
    }

    window.addEventListener(PROJECTS_LOADED_EVENT, handleProjectsLoaded);

    return () =>
      window.removeEventListener(PROJECTS_LOADED_EVENT, handleProjectsLoaded);
  }, []);

  function handleNavigation(key) {
    const route = routeMap[key];

    if (!route) return;

    setActiveTab?.(key);
    navigate(route);
    onNavigate?.();
  }

  function handleProjectChange(event) {
    const projectId = event.target.value;
    const project = projects.find((item) => item.id === projectId) || null;

    setSelectedProjectId(projectId);
    selectActiveProject(project);
  }

  return (
    <aside
      ref={sidebarRef}
      id="primary-navigation"
      className={`sidebar-panel${collapsed ? " is-collapsed" : ""}${
        mobileOpen ? " is-mobile-open" : ""
      }`}
      aria-label="Primary navigation"
    >
      <div className="brand-row">
        <div className="brand-mark" aria-hidden="true">P</div>

        <div className="brand-copy">
          <span className="eyebrow">Workspace</span>
          <strong>ProjectPulse</strong>
        </div>
      </div>

      <div className="project-switcher">
        <div className="project-switcher-label">Active Project</div>
        <style>{`
          .project-switcher-select {
            display: block;
            width: 100%;
            min-width: 0;
            padding: 2px 20px 2px 0;
            border: 0;
            outline: 0;
            background: transparent;
            color: #f8f7fa;
            font-weight: 700;
            font-size: 0.88rem;
            text-overflow: ellipsis;
            cursor: pointer;
          }

          .project-switcher-select:focus-visible {
            outline: 2px solid #f6c8d5;
            outline-offset: 3px;
            border-radius: 4px;
          }

          .project-switcher-select option {
            background: #f8f7fa;
            color: #142b4a;
          }

          .project-switcher-state {
            margin: 0;
            overflow: hidden;
            color: rgba(248, 247, 250, 0.72);
            font-size: 0.78rem;
            line-height: 1.4;
            text-overflow: ellipsis;
          }

          .project-switcher-state p {
            margin: 0;
          }

          .project-switcher-state.error {
            color: #ffb0bd;
          }

          .project-switcher-retry {
            margin-top: 6px;
            padding: 0;
            border: 0;
            background: transparent;
            color: #f6c8d5;
            font: inherit;
            font-weight: 700;
            cursor: pointer;
          }
        `}</style>
        {projectsLoading ? (
          <p className="project-switcher-state" role="status" aria-live="polite">
            Loading projects...
          </p>
        ) : projectsError ? (
          <div className="project-switcher-state error" role="alert">
            <p title={projectsError}>{projectsError}</p>
            <button
              type="button"
              className="project-switcher-retry"
              onClick={() =>
                setProjectsRefreshKey((current) => current + 1)
              }
            >
              Try again
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="project-switcher-state" role="status">
            <p>No projects available</p>
            <button
              type="button"
              className="project-switcher-retry"
              onClick={() =>
                setProjectsRefreshKey((current) => current + 1)
              }
            >
              Refresh
            </button>
          </div>
        ) : (
          <select
            className="project-switcher-select"
            aria-label="Active project"
            value={selectedProjectId}
            onChange={handleProjectChange}
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        )}
      </div>

      <nav className="sidebar-nav" aria-label="Main">
        {navItems.map((item) => {
          const Icon = iconMap[item.key];

          if (!Icon) return null;

          const label =
            item.key === "insights" ? "Analytics" : item.label;
          const isActive = activeTab === item.key;

          return (
            <button
              key={item.key}
              type="button"
              className={`nav-item${isActive ? " active" : ""}`}
              onClick={() => handleNavigation(item.key)}
              aria-current={isActive ? "page" : undefined}
              aria-label={label}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="mini-card">
          <div className="mini-card-label">Delivery risk</div>
          <div className="mini-card-value">Watchlist</div>
        </div>

        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          <ThemeIcon size={18} aria-hidden="true" />
        </button>

        <button
          type="button"
          className="collapse-toggle"
          onClick={onCollapseToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={17} aria-hidden="true" />
          ) : (
            <ChevronLeft size={17} aria-hidden="true" />
          )}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
