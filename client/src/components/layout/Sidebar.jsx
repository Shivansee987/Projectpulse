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

  function handleNavigation(key) {
    const route = routeMap[key];

    if (!route) return;

    setActiveTab?.(key);
    navigate(route);
    onNavigate?.();
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
        <div className="project-switcher-value">Select a project</div>
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
