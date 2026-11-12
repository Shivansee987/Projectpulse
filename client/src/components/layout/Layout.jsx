import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function Layout({ children, activeTab, setActiveTab, onTaskModalOpen, onProjectModalOpen }) {
  return (
    <div className="project-shell">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="main-shell">
        <Navbar
          activeTab={activeTab}
          onTaskModalOpen={onTaskModalOpen}
          onProjectModalOpen={onProjectModalOpen}
        />

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

export default Layout;