/**
 * API Service Layer
 * Single Axios instance shared across the app.
 * Request interceptor injects the JWT token.
 * Response interceptor normalises error messages.
 */
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach stored JWT ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: normalise errors into plain Error objects ─────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.message ||
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login:    (data) => api.post("/auth/login", data),
  getMe:    ()     => api.get("/auth/me"),
};

// ── Donations ─────────────────────────────────────────────────────────────────
export const donationAPI = {
  getAll:          (params)        => api.get("/donations", { params }),
  getById:         (id)            => api.get(`/donations/${id}`),
  create:          (data)          => api.post("/donations", data),
  accept:          (id)            => api.patch(`/donations/${id}/accept`),
  cancel:          (id, reason)    => api.patch(`/donations/${id}/cancel`, { reason }),
  assignVolunteer: (id, volunteerId) =>
    api.post(`/donations/${id}/assign`, { volunteerId }),
  markPickup:      (id)            => api.patch(`/donations/${id}/pickup`),
  markDelivered:   (id, data = {}) => api.patch(`/donations/${id}/deliver`, data),
};

// ── Volunteer ─────────────────────────────────────────────────────────────────
export const volunteerAPI = {
  getAvailable:   () => api.get("/volunteer/available"),
  getAssignments: () => api.get("/volunteer/assignments"),
  getHistory:     () => api.get("/volunteer/history"),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats:        ()        => api.get("/admin/stats"),
  getUsers:        (params)  => api.get("/admin/users",     { params }),
  toggleUser:      (id)      => api.patch(`/admin/users/${id}/toggle`),
  getDonations:    (params)  => api.get("/admin/donations", { params }),
  cancelDonation:  (id, reason) =>
    api.patch(`/admin/donations/${id}/cancel`, { reason }),
};

// ── NGOs ──────────────────────────────────────────────────────────────────────
export const ngoAPI = {
  getAll:         ()            => api.get("/ngos"),
  getNearest:     (lng, lat)    => api.get("/ngos/nearest", { params: { lng, lat } }),
  getVolunteers:  ()            => api.get("/ngos/volunteers"),
};

export default api;
