
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function Layout({
  children,
  activeTab,
  setActiveTab,
  onTaskModalOpen,
  onProjectModalOpen,
  onSearch,
}) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("projectpulse-theme") || "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("projectpulse-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) =>
      current === "light" ? "dark" : "light"
    );
  }

  return (
    <div className="project-shell">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="main-shell">
        <Navbar
          activeTab={activeTab}
          onTaskModalOpen={onTaskModalOpen}
          onProjectModalOpen={onProjectModalOpen}
          onSearch={onSearch}
        />

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

export default Layout;