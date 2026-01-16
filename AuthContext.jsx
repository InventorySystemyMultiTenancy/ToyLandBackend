import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função para extrair o subdomínio
  const getSubdomain = () => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    // Se for localhost ou IP, retorna null
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return null;
    }
    
    // Se tiver mais de 2 partes (ex: toyland.selfmachine.com.br)
    if (parts.length > 2) {
      return parts[0]; // retorna 'toyland'
    }
    
    return null;
  };

  useEffect(() => {
    const buscarEmpresaPorSubdominio = async () => {
      const subdomain = getSubdomain();
      
      if (subdomain) {
        try {
          const response = await api.get(`/empresas/subdomain/${subdomain}`);
          const empresaData = response.data;
          localStorage.setItem("empresa", JSON.stringify(empresaData));
          setEmpresa(empresaData);
        } catch (error) {
          console.error("Erro ao buscar empresa por subdomínio:", error);
          localStorage.removeItem("empresa");
          setEmpresa(null);
        }
      }
    };

    const token = localStorage.getItem("token");
    const usuarioSalvo = localStorage.getItem("usuario");

    if (token && usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    buscarEmpresaPorSubdominio().finally(() => setLoading(false));
  }, []);

  const login = async (email, senha) => {
    try {
      const subdomain = getSubdomain();
      const response = await api.post("/auth/login", { 
        email, 
        senha,
        subdomain
      });
      
      const {
        token,
        usuario: usuarioData,
        empresa: empresaData,
      } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuarioData));
      
      if (empresaData) {
        localStorage.setItem("empresa", JSON.stringify(empresaData));
        setEmpresa(empresaData);
      } else {
        localStorage.removeItem("empresa");
        setEmpresa(null);
      }
      
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUsuario(usuarioData);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Erro ao fazer login",
      };
    }
  };

  const registrar = async (nome, email, senha, telefone) => {
    try {
      const subdomain = getSubdomain();
      const response = await api.post("/auth/registrar", {
        nome,
        email,
        senha,
        telefone,
        subdomain
      });
      
      const {
        token,
        usuario: usuarioData,
        empresa: empresaData,
      } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuarioData));
      
      if (empresaData) {
        localStorage.setItem("empresa", JSON.stringify(empresaData));
        setEmpresa(empresaData);
      } else {
        localStorage.removeItem("empresa");
        setEmpresa(null);
      }
      
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUsuario(usuarioData);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Erro ao registrar",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("empresa");
    delete api.defaults.headers.common["Authorization"];
    setUsuario(null);
    setEmpresa(null);
  };

  const isAdmin = () => usuario?.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        usuario,
        empresa,
        loading,
        login,
        registrar,
        logout,
        isAdmin,
        signed: !!usuario,
        subdomain: getSubdomain(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}