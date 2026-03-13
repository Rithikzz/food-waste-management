import FreshnessBar from './FreshnessBar';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { donationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

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
  iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';

/**
 * DonationTable — responsive table of donations with freshness column.
 * Props:
 *   donations   array
 *   onUpdate    () => void
 *   showActions boolean (default true)
 */
const DonationTable = ({ donations = [], onUpdate, showActions = true }) => {
  const { user } = useAuth();
  const [busyId, setBusyId] = useState(null);

  const act = async (id, fn) => {
    setBusyId(id);
    try { await fn(); onUpdate?.(); }
    catch (err) { alert(err.response?.data?.message ?? 'Action failed.'); }
    finally { setBusyId(null); }
  };

  if (!donations.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">📭</p>
        <p className="font-medium">No donations found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
      <table className="min-w-full bg-white text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
          <tr>
            {['Food', 'Qty', 'Location', 'Pickup', 'Freshness', 'Status', showActions && 'Actions']
              .filter(Boolean)
              .map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
              ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {donations.map((d) => {
            const busy    = busyId === d._id;
            const icon    = CATEGORY_ICON[d.foodCategory] ?? '🍱';
            const name    = d.foodName ?? d.foodType ?? '—';
            const qty     = d.quantity?.value != null
              ? `${d.quantity.value} ${d.quantity.unit}`
              : `${d.quantity}`;
            const address = d.pickupLocation?.address ?? d.pickupLocation ?? '—';
            const pickupAt = d.pickupWindowStart ?? d.pickupTime;
            const score   = d.freshnessScore ?? 100;

            return (
              <tr key={d._id} className={`hover:bg-gray-50/60 transition-colors ${d.isUrgentPickup ? 'bg-red-50/30' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <div>
                      <p className="font-medium text-gray-800 whitespace-nowrap">{name}</p>
                      {d.foodCategory && (
                        <p className="text-xs text-gray-400 capitalize">{d.foodCategory}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{qty}</td>
                <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate" title={address}>{address}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmt(pickupAt)}</td>
                <td className="px-4 py-3 min-w-[140px]">
                  {['available', 'accepted'].includes(d.status)
                    ? <FreshnessBar score={score} compact />
                    : <span className="text-xs text-gray-400">—</span>
                  }
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${STATUS_BADGE[d.status] ?? STATUS_BADGE.available}`}>
                    {d.status?.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </td>
                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {user?.role === 'ngo' && d.status === 'available' && (
                        <button disabled={busy}
                          onClick={() => act(d._id, () => donationsAPI.accept(d._id))}
                          className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1">
                          <FaCheckCircle /> Accept
                        </button>
                      )}
                      {user?.role === 'donor' && ['available', 'accepted'].includes(d.status) && (
                        <button disabled={busy}
                          onClick={() => act(d._id, () => donationsAPI.cancel(d._id, 'Cancelled by donor'))}
                          className="btn-danger text-xs py-1 px-2.5 flex items-center gap-1">
                          <FaTimesCircle /> Cancel
                        </button>
                      )}
                      {user?.role === 'volunteer' && d.status === 'accepted' && (
                        <button disabled={busy}
                          onClick={() => act(d._id, () => donationsAPI.markPickup(d._id))}
                          className="btn-primary text-xs py-1 px-2.5">Pickup</button>
                      )}
                      {user?.role === 'volunteer' && d.status === 'pickedUp' && (
                        <button disabled={busy}
                          onClick={() => act(d._id, () => donationsAPI.markDelivered(d._id))}
                          className="btn-primary text-xs py-1 px-2.5">Delivered</button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DonationTable;
