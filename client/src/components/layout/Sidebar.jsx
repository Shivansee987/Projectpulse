import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  GitBranch,
  LayoutGrid,
  ListTodo,
  Sparkles,
} from "lucide-react";
import { navItems } from "../../data/projectData";

const iconMap = {
  overview: LayoutGrid,
  "task-list": ListTodo,
  dependencies: GitBranch,
  simulator: BarChart3,
  insights: Sparkles,
};

function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="sidebar-panel">
      <div className="brand-row">
        <div className="brand-mark">P</div>
        <div className="brand-copy">
          <span className="eyebrow">Workspace</span>
          <strong>ProjectPulse</strong>
        </div>
      </div>

      <div className="project-switcher">
        <div className="project-switcher-label">Active Project</div>
        <div className="project-switcher-value">Atlas Launch</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = iconMap[item.key];
          const isActive = activeTab === item.key;

          return (
            <button
              key={item.key}
              type="button"
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => setActiveTab(item.key)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="mini-card">
          <div className="mini-card-label">Delivery risk</div>
          <div className="mini-card-value">Watchlist</div>
        </div>
        <button type="button" className="collapse-toggle" aria-label="Collapse sidebar">
          <ChevronLeft size={14} />
          <ChevronRight size={14} className="secondary-icon" />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;