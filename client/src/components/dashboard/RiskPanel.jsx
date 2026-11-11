function RiskPanel() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">
        Risk Alerts
      </h2>

      <div className="space-y-3">
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          High Risk: Backend Development Delay
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          Testing Team Overloaded
        </div>

        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          Deployment On Schedule
        </div>
      </div>
    </div>
  );
}

export default RiskPanel;