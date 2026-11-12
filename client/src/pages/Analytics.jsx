import Layout from "../components/layout/Layout";

function Analytics() {
  return (
    <Layout activeTab="insights" setActiveTab={() => {}}>
      <div className="page-shell">
        <div className="glass-panel" style={{ padding: "28px" }}>
          <p className="eyebrow">AI insights</p>
          <h1 style={{ marginTop: "8px", fontSize: "2.2rem" }}>Project intelligence</h1>
          <p className="subtitle" style={{ marginTop: "8px" }}>
            Bottlenecks, workload concentration, and risk-bearing path analysis are surfaced in real time.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default Analytics;