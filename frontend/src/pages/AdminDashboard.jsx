import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import StatsCard from '../components/StatsCard';
import DonationTable from '../components/DonationTable';
import Loader from '../components/Loader';
import { FaBox, FaUtensils, FaUsers, FaLeaf, FaSync, FaExclamationTriangle, FaBuilding, FaWater, FaFire } from 'react-icons/fa';

const CATEGORY_ICON = {
  cooked: '🍲', raw: '🥦', bakery: '🍞', dairy: '🥛',
  packaged: '📦', beverages: '🧃', other: '🍱',
};

// Simple bar chart via div widths
const MiniBar = ({ value, max, color = 'bg-green-500' }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${max ? (value / max) * 100 : 0}%` }}
      />
    </div>
    <span className="text-xs font-semibold text-gray-600 tabular-nums w-10 text-right">{value}</span>
  </div>
);

const AdminDashboard = () => {
  const [stats,     setStats]     = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [filter,    setFilter]    = useState('all');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sRes, dRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getAllDonations(),
      ]);
      setStats(sRes.data.data ?? sRes.data);
      setDonations(dRes.data.data?.donations ?? dRes.data.data ?? []);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = filter === 'all' ? donations : donations.filter((d) => d.status === filter);

  if (loading) return <Loader fullScreen text="Loading dashboard…" />;

  if (error) {
    return (
      <div className="page-container text-center py-24">
        <FaExclamationTriangle className="text-5xl text-red-400 mx-auto mb-4" />
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <button onClick={fetchAll} className="btn-secondary flex items-center gap-2 mx-auto">
          <FaSync /> Retry
        </button>
      </div>
    );
  }

  const maxMonthly = Math.max(...(stats?.monthlyTrend?.map((m) => m.deliveries) ?? [1]), 1);
  const maxCategory = Math.max(...(stats?.categoryBreakdown?.map((c) => c.count) ?? [1]), 1);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="section-title">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Platform-wide analytics and impact overview.</p>
        </div>
        <button onClick={fetchAll} className="btn-secondary text-sm flex items-center gap-2">
          <FaSync /> Refresh
        </button>
      </div>

      {/* ── Primary Stats Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard icon={<FaBox />}     label="Total Donations"    value={stats?.totalDonations    ?? 0} sublabel="All time"      color="blue"   />
        <StatsCard icon={<FaUtensils />} label="Meals Delivered"   value={stats?.mealsDelivered    ?? 0} sublabel="Successfully"  color="green"  />
        <StatsCard icon={<FaUsers />}   label="Active Volunteers"  value={stats?.activeVolunteers  ?? 0} sublabel="Registered"    color="purple" />
        <StatsCard icon={<FaBuilding />} label="NGOs Participating" value={stats?.ngoParticipating ?? 0} sublabel="Active"        color="orange" />
      </div>

      {/* ── Environmental Impact Section ───────────────────────────────── */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-5">
          <FaLeaf className="text-green-500 text-xl" />
          <h2 className="font-bold text-gray-700 text-lg">Environmental Impact</h2>
          <span className="badge bg-green-100 text-green-700 ml-auto">1 kg food = 2.5 kg CO₂ saved</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Food Saved */}
          <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
            <div className="text-3xl mb-2">🥗</div>
            <p className="text-3xl font-extrabold text-gray-800 tabular-nums">
              {stats?.foodSavedKg ?? 0} <span className="text-base font-semibold text-gray-500">kg</span>
            </p>
            <p className="text-sm font-semibold text-green-700 mt-1">Food Saved from Waste</p>
            <p className="text-xs text-gray-400 mt-0.5">Total food delivered to NGOs</p>
          </div>

          {/* CO₂ Prevented */}
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
            <div className="text-3xl mb-2">🌍</div>
            <p className="text-3xl font-extrabold text-gray-800 tabular-nums">
              {stats?.co2SavedKg ?? 0} <span className="text-base font-semibold text-gray-500">kg</span>
            </p>
            <p className="text-sm font-semibold text-orange-700 mt-1">CO₂ Emissions Prevented</p>
            <p className="text-xs text-gray-400 mt-0.5">= {((stats?.co2SavedKg ?? 0) / 1000).toFixed(3)} tonnes CO₂</p>
          </div>

          {/* Water Saved */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <div className="text-3xl mb-2">💧</div>
            <p className="text-3xl font-extrabold text-gray-800 tabular-nums">
              {((stats?.waterSavedLitres ?? 0) / 1000).toFixed(1)} <span className="text-base font-semibold text-gray-500">kL</span>
            </p>
            <p className="text-sm font-semibold text-blue-700 mt-1">Water Saved</p>
            <p className="text-xs text-gray-400 mt-0.5">{stats?.waterSavedLitres?.toLocaleString() ?? 0} litres total</p>
          </div>
        </div>
      </div>

      {/* ── Donation Status Breakdown ──────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-5 mb-6">

        {/* Status counts */}
        <div className="card">
          <h2 className="font-bold text-gray-700 mb-4">Donation Status Breakdown</h2>
          <div className="space-y-3">
            {stats?.donations && Object.entries(stats.donations)
              .filter(([k]) => k !== 'total')
              .map(([status, count]) => (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600 capitalize">
                      {status.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                  <MiniBar
                    value={count}
                    max={stats.donations.total}
                    color={
                      status === 'delivered' ? 'bg-purple-500' :
                      status === 'available' ? 'bg-green-500'  :
                      status === 'accepted'  ? 'bg-blue-500'   :
                      status === 'pickedUp'  ? 'bg-yellow-400' :
                      'bg-red-400'
                    }
                  />
                </div>
              ))}
          </div>
        </div>

        {/* Food category breakdown */}
        <div className="card">
          <h2 className="font-bold text-gray-700 mb-4">Food Category Breakdown</h2>
          {stats?.categoryBreakdown?.length ? (
            <div className="space-y-3">
              {stats.categoryBreakdown.map((cat) => (
                <div key={cat._id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">
                      {CATEGORY_ICON[cat._id] ?? '🍱'} {cat._id ?? 'other'}
                    </span>
                    <span className="text-xs text-gray-400">{cat.totalMeals} meals</span>
                  </div>
                  <MiniBar value={cat.count} max={maxCategory} color="bg-green-500" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
          )}
        </div>
      </div>

      {/* ── Monthly Delivery Trend ─────────────────────────────────────── */}
      {stats?.monthlyTrend?.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-bold text-gray-700 mb-5">Monthly Delivery Trend</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="pb-3 text-left font-semibold">Month</th>
                  <th className="pb-3 text-left font-semibold">Deliveries</th>
                  <th className="pb-3 text-left font-semibold">Meals Saved</th>
                  <th className="pb-3 text-left font-semibold">CO₂ Offset (kg)</th>
                  <th className="pb-3 text-left font-semibold w-40">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.monthlyTrend.map((m) => (
                  <tr key={m._id} className="hover:bg-gray-50/50">
                    <td className="py-3 font-medium text-gray-700">{m._id}</td>
                    <td className="py-3 text-gray-600 tabular-nums">{m.deliveries}</td>
                    <td className="py-3 text-green-700 font-semibold tabular-nums">{m.mealsSaved}</td>
                    <td className="py-3 text-orange-600 tabular-nums">{m.co2OffsetKg?.toFixed(1)}</td>
                    <td className="py-3 w-40">
                      <MiniBar value={m.deliveries} max={maxMonthly} color="bg-green-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Donations Table ────────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-bold text-gray-700 text-lg">All Donations</h2>
          <div className="flex gap-1 flex-wrap">
            {['all', 'available', 'accepted', 'pickedUp', 'delivered', 'cancelled'].map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`badge text-xs cursor-pointer transition-all ${
                  filter === s ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {s === 'all' ? 'All' : s.replace(/([A-Z])/g, ' $1').trim()}
                {s !== 'all' && (
                  <span className="ml-1 opacity-60">
                    ({donations.filter((d) => d.status === s).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <DonationTable donations={filtered} onUpdate={fetchAll} showActions={false} />
      </div>
    </div>
  );
};

export default AdminDashboard;
