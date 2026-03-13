/**
 * FreshnessBar — visual freshness indicator for a donation.
 *
 * Props:
 *   score     number   0–100
 *   showLabel boolean  (default true) — show text label
 *   compact   boolean  (default false) — smaller, inline variant
 */

const THRESHOLDS = [
  { min: 70, label: 'Fresh',    bar: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  { min: 40, label: 'Moderate', bar: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { min: 0,  label: 'Critical', bar: 'bg-red-500',    text: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
];

const getThreshold = (score) =>
  THRESHOLDS.find((t) => score >= t.min) ?? THRESHOLDS[THRESHOLDS.length - 1];

const FreshnessBar = ({ score = 0, showLabel = true, compact = false }) => {
  const t = getThreshold(score);
  const pct = Math.min(100, Math.max(0, score));
  const isUrgent = score < 30;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${t.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`text-xs font-bold tabular-nums shrink-0 ${t.text}`}>
          {pct}%
        </span>
        {isUrgent && (
          <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full animate-pulse shrink-0">
            URGENT
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${t.bg} ${t.border}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-600">Freshness</span>
          {isUrgent && (
            <span className="text-[10px] font-bold text-red-600 bg-red-200 px-1.5 py-0.5 rounded-full animate-pulse">
              ⚡ URGENT PICKUP
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-extrabold tabular-nums ${t.text}`}>{pct}%</span>
          {showLabel && (
            <span className={`text-xs font-semibold ${t.text} opacity-80`}>— {t.label}</span>
          )}
        </div>
      </div>
      <div className="h-2 bg-white/60 rounded-full overflow-hidden border border-white/40">
        <div
          className={`h-full rounded-full transition-all duration-500 ${t.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default FreshnessBar;
