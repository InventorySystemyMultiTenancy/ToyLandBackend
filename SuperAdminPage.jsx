import React, { useState } from "react";
// Importa a lógica que criamos acima
import { useDashboardData } from "../hooks/useDashboardData";

// Seus componentes existentes
import EmpresasTable from "../components/EmpresasTable";
import LojasTable from "../components/LojasTable";
import UsuariosTable from "../components/UsuariosTable";
import FormLoja from "../components/FormLoja";
import FormUsuario from "../components/FormUsuario";
import FormEmpresa from "../components/FormEmpresa"; // Importe o FormEmpresa
// import EmpresaDetailsModal from "./EmpresaDetailsModal"; // Descomente se tiver

function SuperAdminPage() {
  // 1. Usamos o Hook para pegar dados e ações
  const {
    empresas,
    lojas,
    usuarios,
    loading,
    operationLoading,
    error,
    success,
    actions,
  } = useDashboardData();

  // 2. Estados apenas visuais (modais abertos, filtros)
  const [filtroEmpresaLojas, setFiltroEmpresaLojas] = useState("");
  const [filtroEmpresaUsuarios, setFiltroEmpresaUsuarios] = useState("");

  const [formLoja, setFormLoja] = useState(null);
  const [formUsuario, setFormUsuario] = useState(null);
  const [formEmpresa, setFormEmpresa] = useState(null); // Estado para o formulário de empresa

  // Wrappers simples para conectar o clique do botão com a ação da API
  const handleSaveLoja = async (loja) => {
    const ok = await actions.saveLoja(loja);
    if (ok) setFormLoja(null); // Fecha o form só se der sucesso
  };

  const handleDeleteLoja = async (loja) => {
    if (window.confirm(`Excluir loja ${loja.nome}?`)) {
      actions.deleteLoja(loja.id);
    }
  };

  const handleSaveUsuario = async (usuario) => {
    const ok = await actions.saveUsuario(usuario);
    if (ok) setFormUsuario(null);
  };

  const handleDeleteUsuario = async (usuario) => {
    if (window.confirm(`Excluir usuário ${usuario.nome}?`)) {
      actions.deleteUsuario(usuario.id);
    }
  };

  const handleSaveEmpresa = async (empresa) => {
    const ok = await actions.saveEmpresa(empresa);
    if (ok) setFormEmpresa(null);
  };

  if (loading)
    return <div className="p-10 text-center">Carregando painel...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Painel de Administração{" "}
        <span className="text-blue-600">(SUPER_ADMIN)</span>
      </h1>

      {/* Mensagens de Erro/Sucesso Globais */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between">
          <span>{error}</span>
          <button onClick={actions.clearMessages} className="font-bold">
            X
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex justify-between">
          <span>{success}</span>
          <button onClick={actions.clearMessages} className="font-bold">
            X
          </button>
        </div>
      )}

      {/* Seção de Empresas */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Empresas</h2>
        <EmpresasTable empresas={empresas} />
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => {
            actions.clearMessages();
            setFormEmpresa({ empresa: {}, modo: "create" });
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
          disabled={operationLoading}
        >
          Nova Empresa
        </button>
        <button
          onClick={() => {
            actions.clearMessages();
            setFormLoja({ loja: {}, modo: "create" });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          disabled={operationLoading}
        >
          Nova Loja
        </button>
        <button
          onClick={() => {
            actions.clearMessages();
            setFormUsuario({ usuario: {}, modo: "create" });
          }}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          disabled={operationLoading}
        >
          Novo Usuário
        </button>
      </div>

      {/* Formulários (Aparecem condicionalmente) */}
      {formEmpresa && (
        <div className="bg-white border border-gray-200 rounded shadow p-4 mb-6">
          <h3 className="font-bold mb-2">
            {formEmpresa.modo === "create" ? "Nova Empresa" : "Editar Empresa"}
          </h3>
          <FormEmpresa
            empresa={formEmpresa.empresa}
            onSubmit={async (empresa) => {
              if (!empresa) return setFormEmpresa(null);
              const ok = await actions.saveEmpresa(empresa);
              if (ok) setFormEmpresa(null);
            }}
          />
        </div>
      )}

      {formLoja && (
        <div className="bg-white border border-gray-200 rounded shadow p-4 mb-6">
          <h3 className="font-bold mb-2">
            {formLoja.modo === "create" ? "Nova Loja" : "Editar Loja"}
          </h3>
          <FormLoja
            loja={formLoja.loja}
            empresas={empresas}
            onSubmit={handleSaveLoja}
            onCancel={() => setFormLoja(null)}
            loading={operationLoading}
          />
        </div>
      )}

      {formUsuario && (
        <div className="bg-white border border-gray-200 rounded shadow p-4 mb-6">
          <h3 className="font-bold mb-2">
            {formUsuario.modo === "create" ? "Novo Usuário" : "Editar Usuário"}
          </h3>
          <FormUsuario
            usuario={formUsuario.usuario}
            empresas={empresas}
            onSubmit={handleSaveUsuario}
            onCancel={() => setFormUsuario(null)}
            loading={operationLoading}
          />
        </div>
      )}

      {/* Grids de Lojas e Usuários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">Lojas</h2>
          <LojasTable
            lojas={lojas}
            empresas={empresas}
            filtroEmpresaId={filtroEmpresaLojas}
            setFiltroEmpresaId={setFiltroEmpresaLojas}
            onEdit={(loja) => setFormLoja({ loja, modo: "edit" })}
            onDelete={handleDeleteLoja}
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Usuários</h2>
          <UsuariosTable
            usuarios={usuarios}
            empresas={empresas}
            filtroEmpresaId={filtroEmpresaUsuarios}
            setFiltroEmpresaId={setFiltroEmpresaUsuarios}
            onEdit={(usuario) => setFormUsuario({ usuario, modo: "edit" })}
            onDelete={handleDeleteUsuario}
          />
        </div>
      </div>
    </div>
  );
}

export default SuperAdminPage;
