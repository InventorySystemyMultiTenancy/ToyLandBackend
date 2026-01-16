import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const usuarioSalvo = localStorage.getItem("usuario");
    const empresaSalva = localStorage.getItem("empresa");

    if (token && usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
      if (empresaSalva) setEmpresa(JSON.parse(empresaSalva));
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, senha) => {
    try {
      const response = await api.post("/auth/login", { email, senha });
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
      const response = await api.post("/auth/registrar", {
        nome,
        email,
        senha,
        telefone,
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
