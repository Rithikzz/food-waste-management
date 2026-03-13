/**
 * DonationCard — displays a single donation returned from the API.
 * Field names match the backend response shape (foodName, quantity.value, etc.).
 */
import { FaMapMarkerAlt, FaClock, FaBox, FaUser, FaPhone, FaFire } from "react-icons/fa";

// Maps API status values → display label + Tailwind colour
const STATUS_MAP = {
  available: { label: "Available",  cls: "bg-yellow-100 text-yellow-700" },
  accepted:  { label: "Accepted",   cls: "bg-blue-100 text-blue-700"   },
  pickedUp:  { label: "In Transit", cls: "bg-purple-100 text-purple-700" },
  delivered: { label: "Delivered",  cls: "bg-green-100 text-green-700"  },
  cancelled: { label: "Cancelled",  cls: "bg-red-100 text-red-700"     },
};

// Freshness score bar colour
const freshnessColor = (score) => {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-yellow-400";
  return "bg-red-500";
};

// Compact datetime formatter
const fmt = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch { return iso; }
};

const DonationCard = ({ donation, actionLabel, onAction, actionLoading }) => {
  const {
    _id,
    donorId,
    foodName,
    foodCategory,
    quantity,
    pickupLocation,
    pickupWindowStart,
    expiryTime,
    description,
    status,
    freshnessScore,
    freshnessLabel,
    isUrgentPickup,
  } = donation;

  const { label: statusLabel, cls: statusCls } = STATUS_MAP[status] ?? {
    label: status, cls: "bg-gray-100 text-gray-600",
  };

  const donorName = donorId?.name ?? "—";
  const phone     = donorId?.phone ?? "";

  return (
    <div className={`bg-white rounded-2xl shadow-md border p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow ${
      isUrgentPickup ? "border-red-300" : "border-gray-100"
    }`}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FaUser className="text-green-600 shrink-0" />
          <span className="font-semibold text-gray-800 truncate">{donorName}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isUrgentPickup && (
            <span className="flex items-center gap-1 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-semibold">
              <FaFire /> Urgent
            </span>
          )}
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusCls}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Food details */}
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <FaBox className="text-green-500 shrink-0" />
          <span className="truncate">
            <strong>{foodName}</strong>
            {foodCategory && <span className="text-gray-400"> · {foodCategory}</span>}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <FaBox className="text-orange-400 shrink-0" />
          <span>{quantity?.value} {quantity?.unit}</span>
        </div>
        {phone && (
          <div className="flex items-center gap-1">
            <FaPhone className="text-green-500 shrink-0" />
            <span>{phone}</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-orange-500">
          <FaClock className="shrink-0" />
          <span className="text-xs">Exp: {fmt(expiryTime)}</span>
        </div>
      </div>

      {/* Location */}
      {pickupLocation?.address && (
        <div className="flex items-start gap-1 text-sm text-gray-600">
          <FaMapMarkerAlt className="text-red-400 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{pickupLocation.address}</span>
        </div>
      )}

      {/* Pickup window */}
      {pickupWindowStart && (
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <FaClock className="text-blue-400 shrink-0" />
          <span>Pickup from: {fmt(pickupWindowStart)}</span>
        </div>
      )}

      {/* Freshness bar */}
      {typeof freshnessScore === "number" && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Freshness</span>
            <span>{freshnessLabel?.label ?? ""} ({freshnessScore}%)</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${freshnessColor(freshnessScore)}`}
              style={{ width: `${freshnessScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Optional description */}
      {description && (
        <p className="text-sm text-gray-500 italic border-t pt-2 line-clamp-2">{description}</p>
      )}

      {/* Action button */}
      {actionLabel && onAction && (
        <button
          onClick={() => onAction(_id)}
          disabled={actionLoading}
          className="mt-1 w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 active:scale-95 text-white text-sm font-medium py-2 rounded-xl transition-all"
        >
          {actionLoading ? "Processing…" : actionLabel}
        </button>
      )}
    </div>
  );
};

export default DonationCard;
