import axios from "axios";
import {
  clearAuthSession,
  getAccessToken,
} from "./authStorage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthSession();

      if (window.location.pathname !== "/login") {
        window.dispatchEvent(new CustomEvent("crm:unauthorized"));
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);

export default api;
