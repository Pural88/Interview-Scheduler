import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// The API wraps every payload as { status, message, data }. Unwrap it once
// here so callers keep reading res.data as the payload itself.
api.interceptors.response.use(
  (response) => {
    const body = response.data;
    const isWrapped =
      body &&
      typeof body === "object" &&
      !Array.isArray(body) &&
      "data" in body &&
      ("status" in body || "statusCode" in body);

    if (isWrapped) {
      response.data = body.data;
      response.apiMessage = body.message;
    }

    return response;
  },
  (error) => Promise.reject(error),
);

// Auth API
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (email, password) => api.post("/auth/login", { email, password }),
  logout: () => api.get("/auth/logout"),
  getCurrentUser: () => api.get("/auth/me"),
};

// Users API
export const usersAPI = {
  getUser: (id) => api.get(`/users/${id}`),
  updateMyProfile: (userData) => api.put("/users/me", userData),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);

    return api.post("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getMySessions: () => api.get("/users/me/sessions"),
};

// Slots API
export const slotsAPI = {
  getAvailableSlots: (filters) =>
    api.get("/slots/available", { params: filters }),
  getMySlots: () => api.get("/slots"),
  getSlot: (id) => api.get(`/slots/${id}`),
  createSlot: (slotData) => api.post("/slots", slotData),
  deleteSlot: (id) => api.delete(`/slots/${id}`),
};

// Bookings API
export const bookingsAPI = {
  getMyBookings: () => api.get("/bookings"),
  getBooking: (id) => api.get(`/bookings/${id}`),
  createBooking: (slotId) => api.post("/bookings", { slotId }),
  cancelBooking: (id) => api.delete(`/bookings/${id}`),
};

// Feedback API
export const feedbackAPI = {
  submitFeedback: (data) => api.post("/feedback", data),
  getForBooking: (bookingId) => api.get(`/feedback/booking/${bookingId}`),
  getForUser: (userId) => api.get(`/feedback/user/${userId}`),
};

export default api;
