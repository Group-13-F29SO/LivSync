export default function StatCard({ label, value, sublabel, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold mt-2" style={color ? { color } : { color: '#7c3aed' }}>
        {value}
      </p>
      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
        {sublabel}
      </p>
    </div>
  );
}
