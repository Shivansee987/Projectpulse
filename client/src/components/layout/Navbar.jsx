function Navbar() {
  return (
    <header className="bg-white border-b shadow-sm">
      <div className="flex items-center justify-between px-8 py-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            ProjectPulse Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-slate-600 font-medium">
            Shivansee
          </span>
        </div>
      </div>
    </header>
  );
}

export default Navbar;