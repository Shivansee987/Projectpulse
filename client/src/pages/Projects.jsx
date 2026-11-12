import Layout from "../components/layout/Layout";

function Projects() {
  return (
    <Layout activeTab="overview" setActiveTab={() => {}}>
      <div className="page-shell">
        <div className="glass-panel" style={{ padding: "28px" }}>
          <p className="eyebrow">Portfolio</p>
          <h1 style={{ marginTop: "8px", fontSize: "2.2rem" }}>Project portfolio</h1>
          <p className="subtitle" style={{ marginTop: "8px" }}>
            Atlas Launch, Meridian Cloud, and Northstar Ops are all tracked in one delivery command center.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default Projects;