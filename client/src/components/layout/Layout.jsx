
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useTheme } from "./ThemeContext";
import useDeadlineReminders from "../../hooks/useDeadlineReminders";

function Layout({
  children,
  activeTab,
  setActiveTab,
  onTaskModalOpen,
  onSearch,
}) {
  const { theme, toggleTheme } = useTheme();
  const { notifications, loadError, storageError } =
    useDeadlineReminders();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavState, setMobileNavState] = useState({
    pathname: location.pathname,
    open: false,
  });
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);
  const mobileNavOpen =
    mobileNavState.pathname === location.pathname && mobileNavState.open;

  useEffect(() => {
    if (!mobileNavOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMobileNavState({ pathname: location.pathname, open: false });
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [location.pathname, mobileNavOpen]);

  function toggleMobileNav() {
    const nextState = !mobileNavOpen;
    setMobileNavState({ pathname: location.pathname, open: nextState });

    requestAnimationFrame(() => {
      if (nextState) {
        sidebarRef.current?.querySelector(".nav-item")?.focus();
      } else {
        menuButtonRef.current?.focus();
      }
    });
  }

  function closeMobileNav() {
    setMobileNavState({ pathname: location.pathname, open: false });

    if (mobileNavOpen) {
      requestAnimationFrame(() => menuButtonRef.current?.focus());
    }
  }

  return (
    <div
      className={`project-shell${sidebarCollapsed ? " sidebar-collapsed" : ""}`}
    >
      {mobileNavOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={closeMobileNav}
        />
      )}

      <Sidebar
        sidebarRef={sidebarRef}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileNavOpen}
        onCollapseToggle={() =>
          setSidebarCollapsed((collapsed) => !collapsed)
        }
        onNavigate={closeMobileNav}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="main-shell">
        <Navbar
          menuButtonRef={menuButtonRef}
          mobileNavOpen={mobileNavOpen}
          onMenuToggle={toggleMobileNav}
          onTaskModalOpen={onTaskModalOpen}
          onSearch={onSearch}
          reminders={notifications}
          reminderLoadError={loadError}
          reminderStorageError={storageError}
        />

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

export default Layout;