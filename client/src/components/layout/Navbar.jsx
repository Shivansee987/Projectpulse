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

function formatReminderDate(dateOnly) {
  return new Date(`${dateOnly}T12:00:00`).toLocaleDateString();
}

function getRemainingDaysLabel(days) {
  return days === 0
    ? "Due today"
    : `${days} day${days === 1 ? "" : "s"} left`;
}

function Navbar({
  menuButtonRef,
  mobileNavOpen,
  onMenuToggle,
  onTaskModalOpen,
  onSearch,
  reminders = [],
  reminderLoadError = "",
  reminderStorageError = "",
}) {
  const [searchText, setSearchText] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [permissionError, setPermissionError] = useState("");
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    return window.Notification.permission;
  });
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || "ProjectPulse";

  const requestNotificationPermission = async () => {
    setPermissionError("");

    if (
      typeof window === "undefined" ||
      typeof window.Notification !== "function"
    ) {
      setNotificationPermission("unsupported");
      return;
    }

    try {
      const permission = await window.Notification.requestPermission();
      setNotificationPermission(permission);
    } catch (error) {
      console.error("Could not request desktop notification permission:", error);
      setPermissionError("Desktop notification permission could not be requested.");
    }
  };

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
            {reminders.length > 0 && (
              <span className="notification-count" aria-hidden="true">
                {reminders.length > 99 ? "99+" : reminders.length}
              </span>
            )}
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
              <div className="notification-permission">
                {notificationPermission === "granted" ? (
                  <p>Desktop notifications are enabled.</p>
                ) : notificationPermission === "denied" ? (
                  <p>
                    Desktop notifications are blocked. Allow them in your
                    browser&apos;s site settings.
                  </p>
                ) : notificationPermission === "unsupported" ? (
                  <p>Desktop notifications are not supported in this browser.</p>
                ) : (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={requestNotificationPermission}
                  >
                    Enable desktop notifications
                  </button>
                )}
              </div>

              {permissionError && (
                <p className="notification-error" role="alert">
                  {permissionError}
                </p>
              )}
              {reminderLoadError && (
                <p className="notification-error" role="alert">
                  {reminderLoadError}
                </p>
              )}
              {reminderStorageError && (
                <p className="notification-error" role="alert">
                  {reminderStorageError}
                </p>
              )}

              {reminders.length > 0 ? (
                <ul className="notification-list">
                  {reminders.map((reminder) => (
                    <li key={reminder.id} className="notification-item">
                      <strong>{reminder.taskTitle}</strong>
                      <span>Due {formatReminderDate(reminder.dueDate)}</span>
                      <span
                        className={`notification-priority notification-priority-${(
                          reminder.priority || "Medium"
                        ).toLowerCase()}`}
                      >
                        {reminder.priority || "Medium"} priority
                      </span>
                      <span>
                        {getRemainingDaysLabel(reminder.remainingDays)} ·{" "}
                        {reminder.timeLabel}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="notification-empty">
                  No deadline reminders yet. Add a task due date to receive
                  reminders here.
                </p>
              )}
              <p className="notification-footnote">
                Reminders run only while ProjectPulse is open at 9:00 AM and
                6:00 PM in your local time zone.
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
