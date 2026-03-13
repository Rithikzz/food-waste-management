/**
 * Donations.jsx — Lists donations from the API.
 * Role-based view: donors see their own, NGOs see available+accepted, admin sees all.
 * NGOs can accept available donations and assign volunteers to accepted ones.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useDonations } from "../context/DonationContext";
import { useAuth } from "../context/AuthContext";
import { donationAPI, ngoAPI } from "../services/api";
import DonationCard from "../components/DonationCard";
import Spinner from "../components/Spinner";
import { FaSearch, FaFilter, FaPlus, FaRedo, FaTimes, FaUserCheck } from "react-icons/fa";

// API status values and their display labels
const STATUS_OPTIONS = [
  { value: "all",       label: "All" },
  { value: "available", label: "Available" },
  { value: "accepted",  label: "Accepted"  },
  { value: "pickedUp",  label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const Donations = () => {
  const { donations, loading, error, fetchDonations, acceptDonation, cancelDonation } =
    useDonations();
  const { user } = useAuth();

  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError]   = useState(null); // inline error instead of alert
  const [cancelTarget, setCancelTarget] = useState(null); // donation id awaiting cancel confirm

  // ── Volunteer assignment modal state ────────────────────────────────────────
  const [assignTarget, setAssignTarget] = useState(null);   // donation being assigned
  const [volunteers, setVolunteers]     = useState([]);
  const [volLoading, setVolLoading]     = useState(false);
  const [volError, setVolError]         = useState(null);
  const [selectedVol, setSelectedVol]   = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError]   = useState(null);

  // Open assign modal and fetch volunteers list
  const openAssignModal = async (donation) => {
    setAssignTarget(donation);
    setSelectedVol("");
    setAssignError(null);
    setVolLoading(true);
    setVolError(null);
    try {
      const { data } = await ngoAPI.getVolunteers();
      setVolunteers(data.data.volunteers);
    } catch (err) {
      setVolError(err.message);
    } finally {
      setVolLoading(false);
    }
  };

  const closeAssignModal = () => {
    setAssignTarget(null);
    setSelectedVol("");
    setAssignError(null);
  };

  const handleAssign = async () => {
    if (!selectedVol) { setAssignError("Please select a volunteer"); return; }
    setAssignLoading(true);
    setAssignError(null);
    try {
      await donationAPI.assignVolunteer(assignTarget._id, selectedVol);
      closeAssignModal();
      fetchDonations();
    } catch (err) {
      setAssignError(err.message);
    } finally {
      setAssignLoading(false);
    }
  };

  // Client-side filter (search + status)
  const filtered = donations.filter((d) => {
    const term = search.toLowerCase();
    const matchesSearch =
      d.foodName?.toLowerCase().includes(term) ||
      d.donorId?.name?.toLowerCase().includes(term) ||
      d.pickupLocation?.address?.toLowerCase().includes(term);
    const matchesStatus =
      statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAccept = async (id) => {
    setActionLoading(id);
    setActionError(null);
    try {
      await acceptDonation(id);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id) => {
    // Use inline confirm instead of window.confirm
    setCancelTarget(id);
  };

  const confirmCancel = async () => {
    const id = cancelTarget;
    setCancelTarget(null);
    setActionLoading(id);
    setActionError(null);
    try {
      await cancelDonation(id, "Cancelled by donor");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Decide action button based on role + donation status
  const getAction = (d) => {
    if (user?.role === "ngo" && d.status === "available")
      return { label: "Accept Donation", handler: handleAccept };
    if (user?.role === "ngo" && d.status === "accepted" && d.assignedNgo?._id === user._id)
      return { label: "Assign Volunteer", handler: () => openAssignModal(d) };
    if (user?.role === "donor" && d.status === "available")
      return { label: "Cancel Donation", handler: handleCancel };
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Food Donations</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? "Loading…" : `${donations.length} donation${donations.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => fetchDonations()}
            className="flex items-center gap-2 border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2.5 rounded-xl transition-all text-sm">
            <FaRedo className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          {user?.role === "donor" && (
            <Link to="/donate"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-95">
              <FaPlus /> New Donation
            </Link>
          )}
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input type="text" placeholder="Search by food, donor, or location…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FaFilter className="text-gray-400" />
          {STATUS_OPTIONS.map(({ value, label }) => (
            <button key={value} onClick={() => setStatusFilter(value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                statusFilter === value
                  ? "bg-green-600 text-white shadow"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Action-level inline error */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm flex items-center justify-between">
          <span>⚠️ {actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-600 hover:text-red-800 ml-4">✕</button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => fetchDonations()}
            className="text-red-600 underline hover:no-underline ml-4">Retry</button>
        </div>
      )}

      {/* Loading state */}
      {loading && <Spinner size="lg" className="py-16" />}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🥡</div>
          <p className="text-lg font-medium">No donations found.</p>
          <p className="text-sm mt-1">
            {donations.length === 0
              ? "Be the first to donate!"
              : "Try adjusting your search or filter."}
          </p>
          {user?.role === "donor" && donations.length === 0 && (
            <Link to="/donate"
              className="mt-5 inline-block bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition-all">
              Donate Now
            </Link>
          )}
        </div>
      )}

      {/* Cards grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((d) => {
            const action = getAction(d);
            return (
              <DonationCard
                key={d._id}
                donation={d}
                actionLabel={action?.label ?? null}
                onAction={action?.handler ?? null}
                actionLoading={actionLoading === d._id}
              />
            );
          })}
        </div>
      )}

      {/* ── Cancel Confirmation Dialog ── */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Cancel Donation?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone. The donation will be marked as cancelled.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCancelTarget(null)}
                className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-xl hover:bg-gray-50 transition-all text-sm">
                Keep Donation
              </button>
              <button onClick={confirmCancel}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl transition-all text-sm font-semibold">
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Volunteer Modal ── */}
      {assignTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaUserCheck className="text-green-600" /> Assign Volunteer
              </h3>
              <button onClick={closeAssignModal} className="text-gray-400 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Select a volunteer to pick up{" "}
              <strong>{assignTarget.foodName}</strong> and deliver it to your NGO.
            </p>

            {volLoading && <Spinner size="md" className="py-4" />}
            {volError && (
              <p className="text-red-600 text-sm mb-3">⚠️ {volError}</p>
            )}

            {!volLoading && volunteers.length === 0 && !volError && (
              <p className="text-gray-400 text-sm text-center py-4">
                No registered volunteers found. Ask volunteers to register first.
              </p>
            )}

            {!volLoading && volunteers.length > 0 && (
              <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-xl mb-4 divide-y divide-gray-100">
                {volunteers.map((v) => (
                  <label key={v._id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-green-50 transition-colors ${
                      selectedVol === v._id ? "bg-green-50" : ""
                    }`}
                  >
                    <input type="radio" name="volunteer" value={v._id}
                      checked={selectedVol === v._id}
                      onChange={() => setSelectedVol(v._id)}
                      className="accent-green-600" />
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{v.name}</p>
                      <p className="text-xs text-gray-400">{v.phone ?? v.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {assignError && (
              <p className="text-red-600 text-xs mb-3">⚠️ {assignError}</p>
            )}

            <div className="flex gap-3">
              <button onClick={closeAssignModal}
                className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-xl hover:bg-gray-50 transition-all text-sm">
                Cancel
              </button>
              <button onClick={handleAssign} disabled={assignLoading || !selectedVol}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2 rounded-xl transition-all text-sm font-semibold">
                {assignLoading ? "Assigning…" : "Assign Volunteer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donations;
