/**
 * DonationContext
 * Fetches donations from the API and exposes CRUD actions.
 * Automatically refetches when the authenticated user changes.
 */
import { createContext, useContext, useState, useEffect } from "react";
import { donationAPI } from "../services/api";
import { useAuth } from "./AuthContext";

const DonationContext = createContext();

export const DonationProvider = ({ children }) => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  // ── Fetch donations from API ─────────────────────────────────────────────
  const fetchDonations = async (params = {}) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await donationAPI.getAll(params);
      setDonations(data.data.donations);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reload whenever the logged-in user changes (login / logout)
  useEffect(() => {
    if (!user) {
      setDonations([]);
      setError(null);
      return;
    }
    fetchDonations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  // ── Mutations ────────────────────────────────────────────────────────────
  const addDonation = async (formData) => {
    const { data } = await donationAPI.create(formData);
    const created  = {
      ...data.data.donation,
      freshnessLabel:  data.data.freshnessLabel,
      isUrgentPickup:  data.data.isUrgentPickup,
    };
    setDonations((prev) => [created, ...prev]);
    return created;
  };

  const acceptDonation = async (id) => {
    const { data } = await donationAPI.accept(id);
    const updated  = data.data.donation;
    setDonations((prev) => prev.map((d) => (d._id === id ? updated : d)));
    return updated;
  };

  const cancelDonation = async (id, reason = "") => {
    const { data } = await donationAPI.cancel(id, reason);
    const updated  = data.data.donation;
    setDonations((prev) => prev.map((d) => (d._id === id ? updated : d)));
    return updated;
  };

  // ── Derived stats ────────────────────────────────────────────────────────
  const stats = {
    total:     donations.length,
    available: donations.filter((d) => d.status === "available").length,
    accepted:  donations.filter((d) => d.status === "accepted").length,
    pickedUp:  donations.filter((d) => d.status === "pickedUp").length,
    delivered: donations.filter((d) => d.status === "delivered").length,
    cancelled: donations.filter((d) => d.status === "cancelled").length,
    // legacy alias used by Home.jsx badges
    pending:   donations.filter((d) => d.status === "available").length,
  };

  return (
    <DonationContext.Provider
      value={{
        donations, loading, error, stats,
        fetchDonations, addDonation, acceptDonation, cancelDonation,
      }}
    >
      {children}
    </DonationContext.Provider>
  );
};

// Custom hook for easy context access
export const useDonations = () => {
  const ctx = useContext(DonationContext);
  if (!ctx) throw new Error("useDonations must be used inside DonationProvider");
  return ctx;
};
