import { useState, useEffect, useCallback } from 'react';
import { volunteerAPI, donationsAPI } from '../services/api';
import Loader from '../components/Loader';
import StatusTracker from '../components/StatusTracker';
import FreshnessBar from '../components/FreshnessBar';
import { useAuth } from '../context/AuthContext';
import { FaTruck, FaCheckCircle, FaHistory, FaMapMarkerAlt, FaClock, FaLeaf } from 'react-icons/fa';

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

/**
 * AssignmentCard — shows a VolunteerAssignment with its populated donationId.
 */
const AssignmentCard = ({ assignment, onUpdate }) => {
  const [busy, setBusy] = useState(false);
  const d = assignment.donationId; // populated Donation doc
  if (!d) return null;

  const act = async (fn) => {
    setBusy(true);
    try { await fn(); onUpdate(); }
    catch (err) { alert(err.response?.data?.message ?? 'Action failed.'); }
    finally { setBusy(false); }
  };

  const address  = d.pickupLocation?.address ?? d.pickupLocation ?? '—';
  const pickupAt = d.pickupWindowStart ?? d.pickupTime;
  const name     = d.foodName ?? d.foodType ?? 'Food Donation';
  const qty      = d.quantity?.value != null ? `${d.quantity.value} ${d.quantity.unit}` : String(d.quantity ?? '');
  const score    = d.freshnessScore ?? 100;

  return (
    <div className={`card flex flex-col gap-4 animate-fade-in ${d.isUrgentPickup ? 'ring-2 ring-red-300' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">{name}</h3>
          <p className="text-xs text-gray-400 capitalize">{d.foodCategory} · {qty}</p>
        </div>
        <span className="badge bg-blue-100 text-blue-700 shrink-0">
          {d.status?.replace(/([A-Z])/g, ' $1').trim()}
        </span>
      </div>

      {/* Freshness */}
      {['available', 'accepted'].includes(d.status) && (
        <FreshnessBar score={score} />
      )}

      <div className="space-y-1.5 text-sm text-gray-600">
        <p className="flex items-center gap-2">
          <FaMapMarkerAlt className="text-red-400 shrink-0" />
          {address}
        </p>
        <p className="flex items-center gap-2">
          <FaClock className="text-blue-400 shrink-0" />
          Pickup: {fmt(pickupAt)}
        </p>
        {d.assignedNgo && (
          <p className="flex items-center gap-2 text-xs text-gray-400">
            🏢 NGO: {d.assignedNgo?.ngoProfile?.ngoName ?? d.assignedNgo?.name ?? '—'}
          </p>
        )}
      </div>

      <StatusTracker status={d.status} />

      <div className="flex gap-2 pt-1">
        {d.status === 'accepted' && (
          <button disabled={busy}
            onClick={() => act(() => donationsAPI.markPickup(d._id))}
            className="btn-primary text-sm flex items-center gap-2">
            <FaTruck /> Mark Picked Up
          </button>
        )}
        {d.status === 'pickedUp' && (
          <button disabled={busy}
            onClick={() => act(() => donationsAPI.markDelivered(d._id))}
            className="btn-primary text-sm flex items-center gap-2">
            <FaCheckCircle /> Mark Delivered ✓
          </button>
        )}
      </div>
    </div>
  );
};

const VolunteerDashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [deliveries,  setDeliveries]  = useState([]);
  const [totalImpact, setTotalImpact] = useState({ mealsSaved: 0, co2OffsetKg: 0 });
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [tab,         setTab]         = useState('active');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [aRes, hRes] = await Promise.all([
        volunteerAPI.getAssignments(),
        volunteerAPI.getHistory(),
      ]);
      setAssignments(aRes.data.data?.assignments ?? []);
      setDeliveries(hRes.data.data?.deliveries   ?? []);
      setTotalImpact(hRes.data.data?.totalImpact ?? { mealsSaved: 0, co2OffsetKg: 0 });
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load volunteer data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Active = assignments whose donation is in accepted/pickedUp state
  const active = assignments.filter((a) =>
    ['accepted', 'pickedUp'].includes(a.donationId?.status)
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title">Volunteer Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.name ?? 'Volunteer'}!</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: '🚴', label: 'Active Tasks',        value: active.length,             color: 'bg-blue-50   border-blue-100   text-blue-700'   },
          { icon: '✅', label: 'Deliveries Done',     value: deliveries.length,          color: 'bg-green-50  border-green-100  text-green-700'  },
          { icon: '🍽️', label: 'Meals Delivered',     value: totalImpact.mealsSaved,     color: 'bg-purple-50 border-purple-100 text-purple-700' },
          { icon: '🌱', label: 'CO₂ Saved (kg)',      value: `${totalImpact.co2OffsetKg?.toFixed(1) ?? 0}`, color: 'bg-orange-50 border-orange-100 text-orange-700' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className={`rounded-2xl border p-4 ${color} flex items-center gap-3`}>
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="text-2xl font-extrabold text-gray-800">{value}</p>
              <p className="text-xs font-medium opacity-75">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'active',  label: `Active (${active.length})`,     icon: <FaTruck />   },
          { id: 'history', label: `History (${deliveries.length})`, icon: <FaHistory /> },
        ].map(({ id, label, icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <Loader text="Loading tasks…" />
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-500 mb-3">{error}</p>
          <button onClick={fetchData} className="btn-secondary text-sm">Retry</button>
        </div>
      ) : tab === 'active' ? (
        active.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {active.map((a) => (
              <AssignmentCard key={a._id} assignment={a} onUpdate={fetchData} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🎉</p>
            <p className="font-medium text-lg">No active tasks right now.</p>
            <p className="text-sm mt-1">Check back later — new assignments will appear here.</p>
          </div>
        )
      ) : (
        deliveries.length ? (
          <>
            {/* Personal impact banner */}
            {totalImpact.mealsSaved > 0 && (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-5 mb-6 flex flex-wrap gap-6">
                <div className="flex items-center gap-3">
                  <FaLeaf className="text-green-500 text-2xl" />
                  <div>
                    <p className="text-2xl font-extrabold text-gray-800">{totalImpact.mealsSaved}</p>
                    <p className="text-xs text-gray-500">Total Meals Delivered</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌍</span>
                  <div>
                    <p className="text-2xl font-extrabold text-gray-800">{totalImpact.co2OffsetKg?.toFixed(1)} kg</p>
                    <p className="text-xs text-gray-500">CO₂ Emissions Prevented</p>
                  </div>
                </div>
              </div>
            )}
            <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
              <table className="min-w-full bg-white text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <tr>
                    {['Food', 'Qty', 'Meals Saved', 'CO₂ Saved', 'Delivered On'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {deliveries.map((d) => {
                    const don = d.donationId;
                    return (
                      <tr key={d._id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {don?.foodName ?? don?.foodType ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {don?.quantity?.value != null
                            ? `${don.quantity.value} ${don.quantity.unit}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-green-700 font-semibold">
                          {d.impactSnapshot?.mealsSaved ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-orange-700 font-semibold">
                          {d.impactSnapshot?.co2OffsetKg != null
                            ? `${d.impactSnapshot.co2OffsetKg} kg`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{fmt(d.deliveredAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">No completed deliveries yet.</p>
          </div>
        )
      )}
    </div>
  );
};

export default VolunteerDashboard;
