import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token automaticamente e x-tenant-id para SUPER_ADMIN impersonation
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Impersonation: se SUPER_ADMIN, adiciona x-tenant-id se existir
  try {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const tenantIdImpersonate = localStorage.getItem("tenantIdImpersonate");
    if (usuario?.role === "SUPER_ADMIN" && tenantIdImpersonate) {
      config.headers["x-tenant-id"] = tenantIdImpersonate;
    }
  } catch (e) {}
  return config;
});

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
