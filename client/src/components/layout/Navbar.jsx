import { useState } from "react";
import {
  Bell,
  Menu,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useLocation } from "react-router-dom";

const pageTitles = {
  "/": "Overview",
  "/projects": "Projects",
  "/tasks": "Tasks",
  "/dependencies": "Dependencies",
  "/simulator": "What-If Simulator",
  "/analytics": "Analytics",
};

function Navbar({
  menuButtonRef,
  mobileNavOpen,
  onMenuToggle,
  onTaskModalOpen,
  onSearch,
}) {
  const [searchText, setSearchText] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || "ProjectPulse";

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchText(value);
    onSearch?.(value);
  };

  return (
    <header className="topbar">
      <div className="topbar-leading">
        <button
          ref={menuButtonRef}
          type="button"
          className="mobile-menu-toggle ghost-button"
          onClick={onMenuToggle}
          aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileNavOpen}
          aria-controls="primary-navigation"
        >
          {mobileNavOpen ? (
            <X size={19} aria-hidden="true" />
          ) : (
            <Menu size={19} aria-hidden="true" />
          )}
        </button>
        <div className="topbar-page-title">
          <span className="eyebrow">ProjectPulse</span>
          <p>{pageTitle}</p>
        </div>
      </div>

      {onSearch && (
        <div className="topbar-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search projects, tasks, and risks"
            placeholder="Search projects, tasks, risks..."
            value={searchText}
            onChange={handleSearch}
          />
          {searchText && (
            <button
              type="button"
              className="ghost-button search-clear"
              onClick={() => {
                setSearchText("");
                onSearch?.("");
              }}
              aria-label="Clear search"
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
          {!searchText && <span className="shortcut">Ctrl K</span>}
        </div>
      )}

      <div className="topbar-actions">
        <div className="notification-anchor">
          <button
            type="button"
            className="ghost-button notification-trigger"
            onClick={() =>
              setShowNotifications((current) => !current)
            }
            aria-label="Notifications"
            aria-expanded={showNotifications}
            aria-haspopup="dialog"
            aria-controls="notification-dropdown"
            title="Notifications"
          >
            <Bell size={18} aria-hidden="true" />
          </button>

          {showNotifications && (
            <div
              id="notification-dropdown"
              className="notification-dropdown"
              role="dialog"
              aria-label="Notifications"
            >
              <div className="notification-heading">
                <h2>Notifications</h2>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setShowNotifications(false)}
                  aria-label="Close notifications"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
              <p>
                You&apos;re all caught up. New notifications will appear here
                when notification support is added.
              </p>
            </div>
          )}
        </div>

        {onTaskModalOpen && (
          <button
            type="button"
            className="primary-button"
            onClick={onTaskModalOpen}
          >
            <Plus size={17} aria-hidden="true" />
            <span>New Task</span>
          </button>
        )}

      </div>
    </header>
  );
}

export default Navbar;
