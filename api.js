import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "https://toylandbackend.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Captura subdomínio para multitenancy
  const host = window.location.hostname;
  const subdomain = host.split(".")[0];
  if (subdomain && subdomain !== "www" && subdomain !== "localhost") {
    config.headers["X-Tenant-Subdomain"] = subdomain;
  }
  // Se houver id da loja no localStorage, envia também
  const lojaId = localStorage.getItem("lojaId");
  if (lojaId) {
    config.headers["X-Loja-Id"] = lojaId;
  }
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
  },
);

export default api;
