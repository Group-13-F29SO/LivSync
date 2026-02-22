export default function InfoCard({ icon, title, items, bgColor, textColor }) {
  return (
    <div className={`bg-gradient-to-br p-6 rounded-lg border ${bgColor}`}>
      <h3 className={`font-semibold text-lg mb-3 ${textColor}`}>
        {icon} {title}
      </h3>
      <ul className={`space-y-2 text-sm ${textColor.replace('text-', 'text-').replace('900', '800').replace('200', '300')}`}>
        {items.map((item, index) => (
          <li key={index}>
            • <strong>{item.label}:</strong> {item.description}
          </li>
        ))}
      </ul>
    </div>
  );
}
