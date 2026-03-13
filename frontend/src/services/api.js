// Axios instance + organised API helpers for every backend resource.
// All calls use relative /api paths; Vite proxies to http://localhost:5000 in dev.
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach JWT token to every outgoing request ────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fw_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Global 401 handler — clear token & redirect ───────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('fw_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data)        => api.post('/auth/register', data),
  login:    (data)        => api.post('/auth/login', data),
  getMe:    ()            => api.get('/auth/me'),
};

// ── Donations ─────────────────────────────────────────────────────────────────
export const donationsAPI = {
  getAll:          (params)            => api.get('/donations', { params }),
  getById:         (id)                => api.get(`/donations/${id}`),
  create:          (data)              => api.post('/donations', data),
  accept:          (id)                => api.patch(`/donations/${id}/accept`),
  cancel:          (id, reason)        => api.patch(`/donations/${id}/cancel`, { reason }),
  assignVolunteer: (id, volunteerId)   => api.post(`/donations/${id}/assign`, { volunteerId }),
  markPickup:      (id)                => api.patch(`/donations/${id}/pickup`),
  markDelivered:   (id, data = {})     => api.patch(`/donations/${id}/deliver`, data),
};

// ── Volunteer ─────────────────────────────────────────────────────────────────
export const volunteerAPI = {
  getAssignments: () => api.get('/volunteer/assignments'),
  getHistory:     () => api.get('/volunteer/history'),
};

// ── NGOs ──────────────────────────────────────────────────────────────────────
export const ngoAPI = {
  getAll:     ()       => api.get('/ngos'),
  getNearest: (params) => api.get('/ngos/nearest', { params }),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats:            ()            => api.get('/admin/stats'),
  getUsers:            (params)      => api.get('/admin/users', { params }),
  toggleUser:          (id)          => api.patch(`/admin/users/${id}/toggle`),
  getAllDonations:      (params)      => api.get('/admin/donations', { params }),
  forceCancelDonation: (id, reason)  => api.patch(`/admin/donations/${id}/cancel`, { reason }),
};

export default api;
