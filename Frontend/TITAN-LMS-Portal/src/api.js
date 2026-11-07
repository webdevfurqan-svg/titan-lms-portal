import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://titan-lms-portal-production.up.railway.app/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized request or session expired.");
    }
    return Promise.reject(error);
  }
);

export default api;