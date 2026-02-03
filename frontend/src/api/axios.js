import axios from "axios";
import {
  getAccessToken,
  removeAccessToken,
  removeUser,
} from "../utils/storage";

const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local storage on unauthorized access
      removeAccessToken();
      removeUser();

      // Optional: Redirect to login or dispatch logout action
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
