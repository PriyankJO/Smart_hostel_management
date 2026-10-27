import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const sessionString = sessionStorage.getItem("shms:session");
  if (sessionString) {
    try {
      const session = JSON.parse(sessionString);
      if (session?.token) {
        config.headers.Authorization = `Bearer ${session.token}`;
      }
    } catch (e) {
      console.error('Error parsing session storage', e);
    }
  }
  return config;
});

export default api;
