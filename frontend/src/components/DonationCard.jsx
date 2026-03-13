import { useState } from 'react';
import { FaMapMarkerAlt, FaClock, FaLeaf, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import StatusTracker from './StatusTracker';
import FreshnessBar from './FreshnessBar';
import { donationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_BADGE = {
  available: 'bg-green-100 text-green-700',
  accepted:  'bg-blue-100  text-blue-700',
  pickedUp:  'bg-yellow-100 text-yellow-700',
  delivered: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100   text-red-700',
};

const CATEGORY_ICON = {
  cooked: '🍲', raw: '🥦', bakery: '🍞', dairy: '🥛',
  packaged: '📦', beverages: '🧃', other: '🍱',
};

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

/**
 * DonationCard — single card view of a donation.
 * Props:
 *   donation  object  (donation document with virtual fields)
 *   onUpdate  () => void
 */
const DonationCard = ({ donation, onUpdate }) => {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const act = async (fn) => {
    setBusy(true);
    try { await fn(); onUpdate?.(); }
    catch (err) { alert(err.response?.data?.message ?? 'Action failed.'); }
    finally { setBusy(false); }
  };

  const badgeCls  = STATUS_BADGE[donation.status] ?? STATUS_BADGE.available;
  const catIcon   = CATEGORY_ICON[donation.foodCategory] ?? '🍱';
  const qtyLabel  = donation.quantity
    ? `${donation.quantity.value} ${donation.quantity.unit}`
    : `${donation.quantity} servings`; // legacy fallback
  const address   = donation.pickupLocation?.address ?? donation.pickupLocation ?? '—';
  const pickupAt  = donation.pickupWindowStart ?? donation.pickupTime;
  const score     = donation.freshnessScore ?? 100;

  return (
    <div className={`card flex flex-col gap-4 animate-fade-in ${donation.isUrgentPickup ? 'ring-2 ring-red-300' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xl">{catIcon}</span>
            <h3 className="font-bold text-gray-800 text-lg leading-tight">
              {donation.foodName ?? donation.foodType ?? 'Food Donation'}
            </h3>
          </div>
          <p className="text-xs text-gray-400 capitalize">{donation.foodCategory ?? ''}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`badge ${badgeCls}`}>
            {donation.status?.replace(/([A-Z])/g, ' $1').trim()}
          </span>
          {donation.status === 'delivered' && donation.environmentalImpact?.mealsSaved > 0 && (
            <span className="badge bg-purple-100 text-purple-700 flex items-center gap-1">
              <FaLeaf className="text-xs" /> {donation.environmentalImpact.mealsSaved} meals
            </span>
          )}
        </div>
      </div>

      {/* Freshness Bar */}
      {['available', 'accepted'].includes(donation.status) && (
        <FreshnessBar score={score} />
      )}

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <span className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
          <span className="text-base">{catIcon}</span>
          <span>{qtyLabel}</span>
        </span>
        <span className="flex items-center gap-1.5 col-span-2">
          <FaMapMarkerAlt className="text-red-400 shrink-0" />
          <span className="truncate">{address}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <FaClock className="text-blue-400 shrink-0" />
          <span className="text-xs">Pickup: {fmt(pickupAt)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <FaClock className="text-orange-400 shrink-0" />
          <span className="text-xs">Expires: {fmt(donation.expiryTime)}</span>
        </span>
      </div>

      {/* Status Tracker */}
      <StatusTracker status={donation.status} />

      {/* Actions */}
      <div className="flex gap-2 flex-wrap pt-1">
        {user?.role === 'ngo' && donation.status === 'available' && (
          <button
            disabled={busy}
            onClick={() => act(() => donationsAPI.accept(donation._id))}
            className="btn-primary text-xs flex items-center gap-1"
          >
            <FaCheckCircle /> Accept Donation
          </button>
        )}
        {user?.role === 'donor' && ['available', 'accepted'].includes(donation.status) && (
          <button
            disabled={busy}
            onClick={() => act(() => donationsAPI.cancel(donation._id, 'Cancelled by donor'))}
            className="btn-danger text-xs flex items-center gap-1"
          >
            <FaTimesCircle /> Cancel
          </button>
        )}
        {user?.role === 'volunteer' && donation.status === 'accepted' && (
          <button disabled={busy}
            onClick={() => act(() => donationsAPI.markPickup(donation._id))}
            className="btn-primary text-xs"
          >
            Mark Picked Up
          </button>
        )}
        {user?.role === 'volunteer' && donation.status === 'pickedUp' && (
          <button disabled={busy}
            onClick={() => act(() => donationsAPI.markDelivered(donation._id))}
            className="btn-primary text-xs"
          >
            Mark Delivered ✓
          </button>
        )}
      </div>
    </div>
  );
};

export default DonationCard;
