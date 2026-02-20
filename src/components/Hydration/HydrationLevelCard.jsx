export default function HydrationLevelCard({ title, value, unit, colorClass }) {
  return (
    <div className={`${colorClass} border p-4 rounded-lg`}>
      <h4 className="font-semibold">{title}</h4>
      <p className="text-2xl font-bold mt-2">{value}</p>
      <p className="text-sm mt-1">{unit}</p>
    </div>
  );
}
