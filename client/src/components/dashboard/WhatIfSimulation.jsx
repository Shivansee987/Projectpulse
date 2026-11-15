
function WhatIfSimulation() {
  return (
    <div className="whatif-page">
      <style>{`
        .whatif-page {
          padding: 24px;
          margin-top: 24px;
          border-radius: 16px;
          border: 1px solid var(--border-color, #e2e8f0);
          background: var(--card-bg, #ffffff);
          color: var(--text-primary, #1e293b);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          transition: background 0.25s ease, color 0.25s ease;
        }

        :root[data-theme="dark"] .whatif-page {
          background: #172033;
          border-color: #334155;
          color: #f1f5f9;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
        }

        .whatif-page h2 {
          margin: 0 0 10px;
          font-size: 22px;
          font-weight: 700;
        }

        .whatif-page p {
          margin: 0;
          color: var(--text-secondary, #64748b);
        }

        :root[data-theme="dark"] .whatif-page p {
          color: #94a3b8;
        }
      `}</style>

      <h2>What-If Simulator</h2>
      <p>Testing sidebar navigation...</p>
    </div>
  );
}

export default WhatIfSimulation;
