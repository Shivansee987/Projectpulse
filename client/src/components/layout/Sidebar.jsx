import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-3xl font-bold">
          ProjectPulse
        </h1>
      </div>

      <nav className="p-4 space-y-2">
        <Link
          to="/"
          className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition"
        >
          Dashboard
        </Link>

        <Link
          to="/projects"
          className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition"
        >
          Projects
        </Link>

        <Link
          to="/tasks"
          className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition"
        >
          Tasks
        </Link>

        <Link
          to="/analytics"
          className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition"
        >
          Analytics
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;