
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  LayoutGrid,
  ListTodo,
  Sparkles,
} from "lucide-react";

import { navItems } from "../../data/projectData";
import { useNavigate } from "react-router-dom";

const iconMap = {
  overview: LayoutGrid,
  "task-list": ListTodo,
  dependencies: GitBranch,
  simulator: BarChart3,
  insights: Sparkles,
};

const routeMap = {
  overview: "/",
  "task-list": "/tasks",
  dependencies: "/dependencies",
  simulator: "/simulator",
  insights: "/analytics",
};

function Sidebar({ activeTab, setActiveTab }) {
  const navigate = useNavigate();

  function handleNavigation(key) {
    const route = routeMap[key];

    if (!route) return;

    setActiveTab(key);
    navigate(route);
  }

  const sidebarItems = [...navItems];

  // Ensure Analytics is visible in the sidebar
  if (!sidebarItems.some((item) => item.key === "insights")) {
    sidebarItems.push({
      key: "insights",
      label: "Analytics",
    });
  }

  return (
    <aside className="sidebar-panel">
      {/* Brand */}
      <div className="brand-row">
        <div className="brand-mark">P</div>

        <div className="brand-copy">
          <span className="eyebrow">Workspace</span>
          <strong>ProjectPulse</strong>
        </div>
      </div>

      {/* Project selector label */}
      <div className="project-switcher">
        <div className="project-switcher-label">
          Active Project
        </div>

        <div className="project-switcher-value">
          Select a project
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {sidebarItems.map((item) => {
          const Icon = iconMap[item.key];

          if (!Icon) return null;

          const isActive = activeTab === item.key;

          return (
            <button
              key={item.key}
              type="button"
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => handleNavigation(item.key)}
            >
              <Icon size={16} />

              <span>
                {item.key === "insights"
                  ? "Analytics"
                  : item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="mini-card">
          <div className="mini-card-label">
            Delivery risk
          </div>

          <div className="mini-card-value">
            Watchlist
          </div>
        </div>

        <button
          type="button"
          className="collapse-toggle"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft size={14} />
          <ChevronRight
            size={14}
            className="secondary-icon"
          />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;