function RecentProjects() {
  const projects = [
    {
      name: "ProjectPulse",
      status: "In Progress",
      progress: "75%",
    },
    {
      name: "SafeSpace",
      status: "Planning",
      progress: "25%",
    },
    {
      name: "NEP Portal",
      status: "Completed",
      progress: "100%",
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">
        Recent Projects
      </h2>

      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left p-2">
              Project
            </th>

            <th className="text-left p-2">
              Status
            </th>

            <th className="text-left p-2">
              Progress
            </th>
          </tr>
        </thead>

        <tbody>
          {projects.map((project, index) => (
            <tr key={index}>
              <td className="p-2">
                {project.name}
              </td>

              <td className="p-2">
                {project.status}
              </td>

              <td className="p-2">
                {project.progress}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RecentProjects;