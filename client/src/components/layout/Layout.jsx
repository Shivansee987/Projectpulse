import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;