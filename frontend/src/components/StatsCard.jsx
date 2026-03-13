/**
 * StatsCard — a coloured analytics card used on dashboards.
 *
 * Props:
 *   icon      string | ReactNode
 *   label     string
 *   value     number | string
 *   sublabel  string (optional)
 *   color     'green' | 'blue' | 'orange' | 'red' | 'purple' | 'gray'
 */
const COLORS = {
  green:  'bg-green-50  border-green-100  text-green-600',
  blue:   'bg-blue-50   border-blue-100   text-blue-600',
  orange: 'bg-orange-50 border-orange-100 text-orange-600',
  red:    'bg-red-50    border-red-100    text-red-600',
  purple: 'bg-purple-50 border-purple-100 text-purple-600',
  gray:   'bg-gray-50   border-gray-200   text-gray-500',
};

const StatsCard = ({ icon, label, value, sublabel, color = 'green' }) => {
  const cls = COLORS[color] ?? COLORS.green;

  return (
    <div className={`rounded-2xl border p-5 flex items-start gap-4 ${cls} animate-fade-in`}>
      {icon && <div className="text-3xl mt-0.5 shrink-0 leading-none">{icon}</div>}
      <div className="min-w-0">
        <p className="text-3xl font-extrabold text-gray-800 leading-none tabular-nums">
          {value ?? '—'}
        </p>
        <p className="text-sm font-semibold mt-1 opacity-75">{label}</p>
        {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
};

export default StatsCard;
