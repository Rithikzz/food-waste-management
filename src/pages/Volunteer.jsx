/**
 * Volunteer.jsx — Volunteer dashboard.
 * Fetches live assignments from GET /api/volunteer/assignments.
 * Two-step delivery flow: Confirm Pickup → Mark Delivered.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { volunteerAPI, donationAPI } from "../services/api";
import Spinner from "../components/Spinner";
import {
  FaTruck, FaMapMarkerAlt, FaClock, FaBox, FaUser, FaPhone,
  FaLeaf, FaWater, FaRedo,
} from "react-icons/fa";

// Maps assignment + donation status to a badge style
const STATUS_MAP = {
  pending:    { label: "Pending",     cls: "bg-yellow-100 text-yellow-700" },
  accepted:   { label: "Ready",       cls: "bg-blue-100 text-blue-700"   },
  inProgress: { label: "Picked Up",   cls: "bg-purple-100 text-purple-700" },
  completed:  { label: "Completed",   cls: "bg-green-100 text-green-700"  },
};

const fmt = (iso) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }); }
  catch { return iso; }
};

// ── Single task card ──────────────────────────────────────────────────────────
const TaskCard = ({ assignment, onPickup, onDeliver, actionLoading }) => {
  const d        = assignment.donationId ?? {};
  const donor    = d.donorId ?? {};
  const ngo      = d.assignedNgo ?? {};
  const { label: sLabel, cls: sCls } = STATUS_MAP[assignment.status] ?? {
    label: assignment.status, cls: "bg-gray-100 text-gray-600",
  };

  const isLoading = actionLoading === assignment._id;

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <FaTruck className="text-blue-500" /> Pickup Task
        </span>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${sCls}`}>
          {sLabel}
        </span>
      </div>

      {/* Food + donor info */}
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <FaUser className="text-green-500 shrink-0" />
          <span className="truncate">{donor.name ?? "—"}</span>
        </div>
        <div className="flex items-center gap-1">
          <FaPhone className="text-green-500 shrink-0" />
          <span>{donor.phone ?? "—"}</span>
        </div>
        <div className="flex items-center gap-1 col-span-2">
          <FaBox className="text-orange-400 shrink-0" />
          <span>
            <strong>{d.foodName ?? "—"}</strong>
            {d.quantity && <span className="text-gray-400"> · {d.quantity.value} {d.quantity.unit}</span>}
          </span>
        </div>
        <div className="flex items-center gap-1 col-span-2">
          <FaClock className="text-blue-400 shrink-0" />
          <span>{fmt(d.pickupWindowStart)}</span>
        </div>
      </div>

      {/* Pickup location */}
      <div className="bg-green-50 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-gray-700">
        <FaMapMarkerAlt className="text-red-400 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-0.5">Pickup</p>
          <p>{d.pickupLocation?.address ?? "—"}</p>
        </div>
      </div>

      {/* Delivery destination */}
      <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-gray-700">
        <FaMapMarkerAlt className="text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-0.5">Deliver To</p>
          <p>{ngo.name ?? ngo.ngoProfile?.ngoName ?? "Community Centre / Shelter"}</p>
        </div>
      </div>

      {/* Action buttons */}
      {(assignment.status === "pending" || assignment.status === "accepted") && (
        <button onClick={() => onPickup(assignment._id, d._id)}
          disabled={isLoading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 active:scale-95 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all">
          {isLoading ? "Processing…" : <><FaTruck /> Confirm Pickup</>}
        </button>
      )}

      {assignment.status === "inProgress" && (
        <button onClick={() => onDeliver(assignment._id, d._id)}
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 active:scale-95 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all">
          {isLoading ? "Processing…" : <><FaTruck /> Mark as Delivered</>}
        </button>
      )}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const Volunteer = () => {
  const [assignments, setAssignments] = useState([]);
  const [available, setAvailable]     = useState([]);
  const [history, setHistory]         = useState([]);
  const [impact, setImpact]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [tab, setTab]                 = useState("available");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [avRes, aRes, hRes] = await Promise.all([
        volunteerAPI.getAvailable(),
        volunteerAPI.getAssignments(),
        volunteerAPI.getHistory(),
      ]);
      setAvailable(avRes.data.data.donations);
      setAssignments(aRes.data.data.assignments);
      setHistory(hRes.data.data.deliveries);
      setImpact(hRes.data.data.totalImpact);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const [actionError, setActionError] = useState(null);

  const handlePickup = async (assignmentId, donationId) => {
    setActionLoading(assignmentId);
    setActionError(null);
    try {
      await donationAPI.markPickup(donationId);
      await loadData();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliver = async (assignmentId, donationId) => {
    setActionLoading(assignmentId);
    setActionError(null);
    try {
      await donationAPI.markDelivered(donationId);
      await loadData();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount   = assignments.filter((a) => a.status !== "inProgress").length;
  const inProgressCount = assignments.filter((a) => a.status === "inProgress").length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaTruck className="text-blue-500" /> Volunteer Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Pick up accepted donations and deliver them to NGOs.
          </p>
        </div>
        <button onClick={loadData}
          className="flex items-center gap-2 border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-xl transition-all text-sm">
          <FaRedo className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Available",      value: available.length,   color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
          { label: "Active Tasks",   value: assignments.length, color: "bg-blue-50 text-blue-700 border-blue-200" },
          { label: "In Transit",     value: inProgressCount,    color: "bg-purple-50 text-purple-700 border-purple-200" },
          { label: "Total Delivered",value: history.length,     color: "bg-green-50 text-green-700 border-green-200" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl border px-5 py-4 ${color} text-center`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs mt-0.5 font-medium opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* Personal impact */}
      {impact && (impact.mealsSaved > 0 || impact.co2OffsetKg > 0) && (
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-5 mb-8 text-white">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><FaLeaf /> Your Impact</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-extrabold">{impact.mealsSaved}</p>
              <p className="text-xs text-green-200">Meals Saved</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold">{impact.co2OffsetKg.toFixed(1)} kg</p>
              <p className="text-xs text-green-200">CO₂ Offset</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold"><FaWater className="inline mr-1" />{Math.round(impact.waterSavedLitres)}L</p>
              <p className="text-xs text-green-200">Water Saved</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {["available", "active", "history"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === t ? "bg-white shadow text-green-700" : "text-gray-500 hover:text-gray-700"
            }`}>
            {t === "available" ? `Available (${available.length})` :
             t === "active"    ? `My Tasks (${assignments.length})` :
                                 `History (${history.length})`}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Action error */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm flex items-center justify-between">
          ⚠️ {actionError}
          <button onClick={() => setActionError(null)} className="text-red-600 hover:text-red-800 ml-4">✕</button>
        </div>
      )}

      {loading && <Spinner size="lg" className="py-16" />}

      {/* Available donations — volunteer can self-assign */}
      {!loading && tab === "available" && (
        available.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🍱</div>
            <p className="text-lg font-medium">No donations available for pickup right now.</p>
            <p className="text-sm mt-1">Check back once an NGO has accepted a donation.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {available.map((d) => {
              const donor = d.donorId ?? {};
              const ngo   = d.assignedNgo ?? {};
              const isLoading = actionLoading === d._id;
              return (
                <div key={d._id} className="bg-white rounded-2xl shadow border border-yellow-100 p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 text-lg flex items-center gap-2">
                      <FaBox className="text-orange-400" /> {d.foodName}
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                      Needs Pickup
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <FaUser className="text-green-500 shrink-0" />
                      <span className="truncate">{donor.name ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaPhone className="text-green-500 shrink-0" />
                      <span>{donor.phone ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-1 col-span-2">
                      <FaClock className="text-blue-400 shrink-0" />
                      <span>{fmt(d.pickupWindowStart)}</span>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-gray-700">
                    <FaMapMarkerAlt className="text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-0.5">Pickup</p>
                      <p>{d.pickupLocation?.address ?? "—"}</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-gray-700">
                    <FaMapMarkerAlt className="text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-0.5">Deliver To</p>
                      <p>{ngo.name ?? ngo.ngoProfile?.ngoName ?? "Community Centre / Shelter"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePickup(d._id, d._id)}
                    disabled={isLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 active:scale-95 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all">
                    {isLoading ? "Processing…" : <><FaTruck /> Take This Task</>}
                  </button>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Active assignments */}
      {!loading && tab === "active" && (
        assignments.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🚚</div>
            <p className="text-lg font-medium">No active tasks right now.</p>
            <p className="text-sm mt-1">Check back once a donation has been assigned to you.</p>
            <Link to="/donations"
              className="mt-5 inline-block bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-all">
              View Donations
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((a) => (
              <TaskCard key={a._id} assignment={a}
                onPickup={handlePickup} onDeliver={handleDeliver}
                actionLoading={actionLoading} />
            ))}
          </div>
        )
      )}

      {/* Delivery history */}
      {!loading && tab === "history" && (
        history.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📦</div>
            <p>No completed deliveries yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  {["#", "Food", "Quantity", "Meals Saved", "CO₂ Offset", "Delivered On"].map((h) => (
                    <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map((h, i) => {
                  const d = h.donationId ?? {};
                  return (
                    <tr key={h._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-gray-700">{d.foodName ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {d.quantity ? `${d.quantity.value} ${d.quantity.unit}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-green-700 font-semibold">
                        {h.impactSnapshot?.mealsSaved ?? 0}
                      </td>
                      <td className="px-4 py-3 text-blue-700">
                        {(h.impactSnapshot?.co2OffsetKg ?? 0).toFixed(1)} kg
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {fmt(h.deliveredAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

export default Volunteer;
