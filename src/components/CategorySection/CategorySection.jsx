import BadgeCard from '../BadgeCard/BadgeCard';

export default function CategorySection({ category, badges }) {
  return (
    <div className="mb-12">
      {/* Category Header */}
      <h2 className="mb-6 text-2xl font-bold text-slate-900">{category}</h2>

      {/* Badge Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {badges.map((badge) => (
          <BadgeCard
            key={badge.id}
            icon={badge.icon}
            name={badge.name}
            description={badge.description}
            status={badge.status}
            earnedDate={badge.earnedDate}
          />
        ))}
      </div>
    </div>
  );
}
