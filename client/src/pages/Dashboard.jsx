import Layout from "../components/layout/Layout";

function Dashboard() {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Dashboard
        </h1>

        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-gray-500">Projects</h3>
            <p className="text-3xl font-bold">12</p>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-gray-500">Tasks</h3>
            <p className="text-3xl font-bold">86</p>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-gray-500">Risks</h3>
            <p className="text-3xl font-bold text-red-500">5</p>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-gray-500">Team Members</h3>
            <p className="text-3xl font-bold">18</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-5 h-72">
            <h2 className="font-semibold mb-3">
              Dependency Graph
            </h2>
          </div>

          <div className="bg-white rounded-xl shadow p-5 h-72">
            <h2 className="font-semibold mb-3">
              Risk Analysis
            </h2>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;