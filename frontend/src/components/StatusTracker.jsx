/**
 * StatusTracker — visual step-progress bar for donation lifecycle.
 * Statuses:  available → accepted → pickedUp → delivered
 * Special:   cancelled (shown as a red badge instead of the steps)
 */
const STEPS = [
  { key: 'available', label: 'Available', desc: 'Listed'    },
  { key: 'accepted',  label: 'Accepted',  desc: 'NGO took'  },
  { key: 'pickedUp',  label: 'Picked Up', desc: 'In transit'},
  { key: 'delivered', label: 'Delivered', desc: 'Done ✓'    },
];

const indexOf = (status) => STEPS.findIndex((s) => s.key === status);

const StatusTracker = ({ status }) => {
  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        Cancelled
      </span>
    );
  }

  const current = indexOf(status);

  return (
    <div className="w-full">
      <div className="flex items-start">
        {STEPS.map((step, i) => {
          const done   = i <  current;
          const active = i === current;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Node */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    done
                      ? 'bg-green-600 border-green-600 text-white'
                      : active
                      ? 'bg-white border-green-600 text-green-600 ring-4 ring-green-100'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </div>
                <div className="text-center hidden sm:block">
                  <p className={`text-[10px] font-semibold leading-none ${
                    active ? 'text-green-700' : done ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{step.desc}</p>
                </div>
              </div>

              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mb-5 mx-0.5 transition-colors ${
                  i < current ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusTracker;
