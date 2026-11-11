import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div className="w-64 min-h-screen bg-slate-900 text-white">
      <div className="p-6 text-2xl font-bold border-b border-slate-700">
        ProjectPulse
      </div>

      <div className="flex flex-col p-4 gap-2">
        <Link
          className="p-3 rounded-lg hover:bg-slate-800"
          to="/"
        >
          Dashboard
        </Link>

        <Link
          className="p-3 rounded-lg hover:bg-slate-800"
          to="/projects"
        >
          Projects
        </Link>

        <Link
          className="p-3 rounded-lg hover:bg-slate-800"
          to="/tasks"
        >
          Tasks
        </Link>

        <Link
          className="p-3 rounded-lg hover:bg-slate-800"
          to="/analytics"
        >
          Analytics
        </Link>
      </div>
    </div>
  );
}

export default Sidebar;