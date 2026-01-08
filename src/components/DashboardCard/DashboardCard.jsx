export default function DashboardCard({ 
  title, 
  icon, 
  iconBgColor = 'bg-blue-50', 
  iconColor = 'text-blue-600',
  value, 
  unit, 
  subtitle 
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow transform transition-transform duration-500 hover:-translate-y-1 hover:scale-105 hover:shadow-xl hover:z-10">
      <div className="flex items-center gap-3">
        <div className={`p-2 ${iconBgColor} rounded-md`}>
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      
      {subtitle && (
        <p className="text-gray-500 mt-2">{subtitle}</p>
      )}

      <div className="mt-4 flex items-baseline gap-3">
        <span className="inline-block text-4xl md:text-5xl font-bold bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">
          {value}
        </span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
    </div>
  );
}
