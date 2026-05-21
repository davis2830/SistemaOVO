const COLOR_MAP = {
  yolk: { bg: 'bg-yolk/10', text: 'text-yolk' },
  leaf: { bg: 'bg-leaf/10', text: 'text-leaf' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-500' },
  red: { bg: 'bg-red-50', text: 'text-red-500' },
};

export default function StatCard({ title, value, icon, color = 'yolk', subtitle }) {
  const c = COLOR_MAP[color] || COLOR_MAP.yolk;
  return (
    <div className="bg-white p-6 rounded-3xl shadow-premium border border-gray-50 hover:shadow-xl transition-shadow group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-display font-extrabold text-charcoal">{value}</h3>
          {subtitle && (
            <p className="mt-3 text-xs font-bold text-gray-400">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`w-12 h-12 ${c.bg} rounded-2xl flex items-center justify-center ${c.text} group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
