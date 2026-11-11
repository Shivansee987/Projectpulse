function StatsCard({ title, value, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className={`h-2 rounded-full mb-4 ${color}`} />

      <p className="text-gray-500">
        {title}
      </p>

      <h2 className="text-4xl font-bold mt-2">
        {value}
      </h2>
    </div>
  );
}

export default StatsCard;