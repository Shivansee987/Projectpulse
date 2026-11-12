import Layout from "../components/layout/Layout";

function Tasks() {
  return (
    <Layout activeTab="task-list" setActiveTab={() => {}}>
      <div className="page-shell">
        <div className="glass-panel" style={{ padding: "28px" }}>
          <p className="eyebrow">Task list</p>
          <h1 style={{ marginTop: "8px", fontSize: "2.2rem" }}>Delivery queue</h1>
          <p className="subtitle" style={{ marginTop: "8px" }}>
            Cross-functional task entries can be reviewed, updated, and prioritized from a single workspace.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default Tasks;