import { Bell, FolderPlus, Plus, Search } from "lucide-react";

function Navbar({ activeTab, onTaskModalOpen, onProjectModalOpen }) {
  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={16} />
        <input type="text" placeholder="Search projects, tasks, risks..." />
        <span className="shortcut">⌘ K</span>
      </div>

      <div className="topbar-actions">
        <div className="project-status-badge">
          <span className="dot" />
          {activeTab === "overview" ? "Overview" : activeTab.replace("-", " ")}
        </div>

        <div className="avatar-stack">
          <span>AL</span>
          <span>RM</span>
          <span>JW</span>
        </div>

        <button type="button" className="ghost-button">
          <Bell size={16} />
        </button>

        <button type="button" className="primary-button" onClick={onTaskModalOpen}>
          <Plus size={16} />
          New Task
        </button>

        <button type="button" className="secondary-button" onClick={onProjectModalOpen}>
          <FolderPlus size={16} />
          New Project
        </button>
      </div>
    </header>
  );
}

export default Navbar;