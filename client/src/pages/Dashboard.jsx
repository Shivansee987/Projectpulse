import Layout from "../components/layout/Layout";

function Dashboard() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">
            Project Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Monitor projects, risks and team workload.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-500">Projects</p>
            <h2 className="text-4xl font-bold mt-2">12</h2>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-500">Tasks</p>
            <h2 className="text-4xl font-bold mt-2">86</h2>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-500">Risks</p>
            <h2 className="text-4xl font-bold mt-2 text-red-500">5</h2>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-500">Members</p>
            <h2 className="text-4xl font-bold mt-2">18</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 h-96">
            <h2 className="text-xl font-semibold mb-4">
              Dependency Graph
            </h2>

            <div className="h-72 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400">
              React Flow Graph Here
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 h-96">
            <h2 className="text-xl font-semibold mb-4">
              Risk Analysis
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                High Risk Tasks: 5
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                Medium Risk Tasks: 8
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                Low Risk Tasks: 12
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;