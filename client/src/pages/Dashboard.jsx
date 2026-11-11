import Layout from "../components/layout/Layout";
import StatsCard from "../components/dashboard/StatsCard";
import RecentProjects from "../components/dashboard/RecentProjects";
import RiskPanel from "../components/dashboard/RiskPanel";
import DependencyGraph from "../components/dashboard/DependencyGraph";

function Dashboard() {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold">
            Project Dashboard
          </h1>

          <p className="text-gray-500">
            Intelligent Project Planning & Risk Analysis
          </p>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <StatsCard
            title="Projects"
            value="12"
            color="bg-blue-500"
          />

          <StatsCard
            title="Tasks"
            value="86"
            color="bg-green-500"
          />

          <StatsCard
            title="Risks"
            value="5"
            color="bg-red-500"
          />

          <StatsCard
            title="Members"
            value="18"
            color="bg-purple-500"
          />
        </div>

        <DependencyGraph />

        <div className="grid grid-cols-2 gap-6">
          <RecentProjects />
          <RiskPanel />
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;