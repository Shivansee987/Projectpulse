
import { useState } from "react";
import { Bell, FolderPlus, Plus, Search, X } from "lucide-react";

function Navbar({
  activeTab,
  onTaskModalOpen,
  onProjectModalOpen,
  onSearch,
}) {
  const [searchText, setSearchText] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  // Show navbar only on Dashboard
  if (activeTab !== "overview") {
    return null;
  }

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchText(value);
    onSearch?.(value);
  };

  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={16} />

        <input
          type="text"
          placeholder="Search projects, tasks, risks..."
          value={searchText}
          onChange={handleSearch}
        />

        {searchText && (
          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              setSearchText("");
              onSearch?.("");
            }}
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}

        <span className="shortcut">Ctrl K</span>
      </div>

      <div className="topbar-actions">
        <div className="project-status-badge">
          <span className="dot" />
          Dashboard
        </div>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="ghost-button"
            onClick={() => setShowNotifications((current) => !current)}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={16} />
          </button>

          {showNotifications && (
            <div
              className="glass-panel"
              style={{
                position: "absolute",
                top: "45px",
                right: 0,
                width: "270px",
                padding: "18px",
                zIndex: 1000,
              }}
            >
              <h3>Notifications</h3>

              <p className="subtitle" style={{ marginTop: "10px" }}>
                You're all caught up. New notifications will appear here
                when notification support is added.
              </p>

              <button
                type="button"
                className="secondary-button"
                style={{ marginTop: "14px" }}
                onClick={() => setShowNotifications(false)}
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* New Task */}
        <button
          type="button"
          className="primary-button"
          onClick={onTaskModalOpen}
        >
          <Plus size={16} />
          New Task
        </button>

        {/* New Project */}
        <button
          type="button"
          className="secondary-button"
          onClick={onProjectModalOpen}
        >
          <FolderPlus size={16} />
          New Project
        </button>
      </div>
    </header>
  );
}

export default Navbar;
