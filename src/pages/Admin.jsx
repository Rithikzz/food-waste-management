/**
 * Admin.jsx — Admin dashboard.
 * Fetches platform-wide stats from GET /api/admin/stats.
 * Fetches all donations (paginated) from GET /api/admin/donations.
 */
import { useState, useEffect, useCallback } from "react";
import { adminAPI } from "../services/api";
import Spinner from "../components/Spinner";
import {
  FaChartBar, FaBox, FaCheckCircle, FaTruck, FaHourglassHalf,
  FaLeaf, FaWater, FaUsers, FaRedo, FaBan,
} from "react-icons/fa";

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color }) => (
  <div className={`rounded-2xl shadow p-5 flex items-center gap-4 border ${color}`}>
    <div className="text-3xl">{icon}</div>
    <div>
      <p className="text-2xl font-extrabold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
    </div>
  </div>
);

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    available: "bg-yellow-100 text-yellow-700",
    accepted:  "bg-blue-100 text-blue-700",
    pickedUp:  "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };
  const labels = {
    available: "Available", accepted: "Accepted",
    pickedUp: "In Transit", delivered: "Delivered", cancelled: "Cancelled",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {labels[status] ?? status}
    </span>
  );
};

const fmt = (iso) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }); }
  catch { return iso; }
};

// ── Page ──────────────────────────────────────────────────────────────────────
const Admin = () => {
  const [stats, setStats]         = useState(null);
  const [donations, setDonations] = useState([]);
  const [loadingStats, setLoadingStats]     = useState(true);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [statsError, setStatsError]         = useState(null);
  const [donationsError, setDonationsError] = useState(null);
  const [search, setSearch]                 = useState("");
  const [actionLoading, setActionLoading]   = useState(null);
  const [actionError, setActionError]       = useState(null);
  const [cancelTarget, setCancelTarget]     = useState(null); // donation id for inline confirm

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    setStatsError(null);
    try {
      const { data } = await adminAPI.getStats();
      setStats(data.data);
    } catch (err) {
      setStatsError(err.message);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadDonations = useCallback(async () => {
    setLoadingDonations(true);
    setDonationsError(null);
    try {
      const { data } = await adminAPI.getDonations({ limit: 50 });
      setDonations(data.data.donations);
    } catch (err) {
      setDonationsError(err.message);
    } finally {
      setLoadingDonations(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadDonations();
  }, [loadStats, loadDonations]);

  const handleCancel = async (id) => {
    setCancelTarget(id);
  };

  const confirmCancel = async () => {
    const id = cancelTarget;
    setCancelTarget(null);
    setActionLoading(id);
    setActionError(null);
    try {
      await adminAPI.cancelDonation(id, "Cancelled by admin");
      await loadDonations();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = donations.filter((d) => {
    const t = search.toLowerCase();
    return (
      d.foodName?.toLowerCase().includes(t) ||
      d.donorId?.name?.toLowerCase().includes(t) ||
      d.pickupLocation?.address?.toLowerCase().includes(t)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <FaChartBar className="text-green-600 text-3xl" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Platform-wide analytics and management.</p>
          </div>
        </div>
        <button onClick={() => { loadStats(); loadDonations(); }}
          className="flex items-center gap-2 border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-xl transition-all text-sm">
          <FaRedo className={(loadingStats || loadingDonations) ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* ── Stats error ── */}
      {statsError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
          ⚠️ Failed to load stats: {statsError}
        </div>
      )}

      {/* ── Stats Cards ── */}
      {loadingStats ? (
        <Spinner size="lg" className="py-12" />
      ) : stats && (
        <>
          {/* Donation status counts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <StatCard icon={<FaBox className="text-gray-600" />}    label="Total Donations"  value={stats.totalDonations}   color="bg-white border-gray-100" />
            <StatCard icon={<FaHourglassHalf className="text-yellow-500" />} label="Pending" value={stats.pendingDonations}  color="bg-yellow-50 border-yellow-200" />
            <StatCard icon={<FaCheckCircle className="text-blue-500" />}  label="Accepted"   value={stats.donations?.accepted ?? 0} color="bg-blue-50 border-blue-200" />
            <StatCard icon={<FaTruck className="text-green-500" />}       label="Delivered"  value={stats.totalDeliveries}  color="bg-green-50 border-green-200" />
            <StatCard icon={<FaBan className="text-red-400" />}           label="Cancelled"  value={stats.cancelledDonations} color="bg-red-50 border-red-200" />
          </div>

          {/* User counts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatCard icon={<FaUsers className="text-green-600" />}     label="Total Users"     value={stats.users?.total ?? 0}   color="bg-white border-gray-100" />
            <StatCard icon={<FaLeaf className="text-green-500" />}      label="Donors"          value={stats.users?.donor ?? 0}   color="bg-green-50 border-green-200" />
            <StatCard icon={<FaBox className="text-blue-500" />}        label="NGO Partners"    value={stats.ngoParticipating}    color="bg-blue-50 border-blue-200" />
            <StatCard icon={<FaTruck className="text-purple-500" />}    label="Volunteers"      value={stats.activeVolunteers}    color="bg-purple-50 border-purple-200" />
          </div>

          {/* Environmental impact */}
          <div className="bg-gradient-to-r from-green-700 to-green-500 rounded-2xl p-6 mb-10 text-white">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <FaLeaf /> Environmental Impact
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-3xl font-extrabold">{stats.mealsDelivered?.toLocaleString()}</p>
                <p className="text-xs text-green-200 mt-1">Meals Delivered</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold">{stats.foodSavedKg?.toLocaleString()} kg</p>
                <p className="text-xs text-green-200 mt-1">Food Saved</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold">{stats.co2SavedKg?.toLocaleString()} kg</p>
                <p className="text-xs text-green-200 mt-1">CO₂ Offset</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold flex items-center justify-center gap-1">
                  <FaWater className="text-blue-300" />
                  {stats.waterSavedLitres?.toLocaleString()} L
                </p>
                <p className="text-xs text-green-200 mt-1">Water Saved</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Donations Table ── */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-700 text-lg">All Donations</h2>
          <input type="text" placeholder="Search donations…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>

        {/* Donations error */}
        {donationsError && (
          <div className="px-5 py-3 bg-red-50 text-red-700 text-sm">
            ⚠️ {donationsError}
          </div>
        )}

        {loadingDonations ? (
          <Spinner size="lg" className="py-12" />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <p>No donations found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  {["#", "Donor", "Food", "Qty", "Location", "Pickup From", "Expiry", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((d, i) => (
                  <tr key={d._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                      {d.donorId?.name ?? "—"}
                      {d.donorId?.email && (
                        <span className="block text-xs text-gray-400 font-normal">{d.donorId.email}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {d.foodName}
                      <span className="block text-xs text-gray-400">{d.foodCategory}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {d.quantity?.value} {d.quantity?.unit}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">
                      {d.pickupLocation?.address ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmt(d.pickupWindowStart)}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmt(d.expiryTime)}</td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-3">
                      {d.status !== "delivered" && d.status !== "cancelled" && (
                        <button onClick={() => handleCancel(d._id)}
                          disabled={actionLoading === d._id}
                          className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg transition-colors disabled:opacity-60">
                          {actionLoading === d._id ? "…" : "Cancel"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-right">
        Data fetched live from MongoDB via REST API.
      </p>

      {/* Inline action error */}
      {actionError && (
        <div className="fixed bottom-6 right-6 bg-red-600 text-white text-sm rounded-xl px-5 py-3 shadow-lg flex items-center gap-3 z-50">
          ⚠️ {actionError}
          <button onClick={() => setActionError(null)} className="hover:text-red-200">✕</button>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Force-Cancel Donation?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will immediately cancel the donation and notify all parties.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCancelTarget(null)}
                className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-xl hover:bg-gray-50 transition-all text-sm">
                Go Back
              </button>
              <button onClick={confirmCancel}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl transition-all text-sm font-semibold">
                Yes, Cancel It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
