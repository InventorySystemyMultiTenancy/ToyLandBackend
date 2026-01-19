import React from "react";

const FormUsuario = ({ usuario, onSubmit, empresas, onCancel }) => {
  const [nome, setNome] = React.useState(usuario?.nome || "");
  const [email, setEmail] = React.useState(usuario?.email || "");
  const [empresaId, setEmpresaId] = React.useState(usuario?.empresaId || "");
  const [role, setRole] = React.useState(usuario?.role || "FUNCIONARIO");
  const [senha, setSenha] = React.useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!nome || !email || !empresaId || !senha) return;
    onSubmit({ ...usuario, nome, email, empresaId, role, senha });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block font-medium mb-1">Nome:</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Empresa:</label>
        <select
          value={empresaId}
          onChange={(e) => setEmpresaId(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Selecione a empresa</option>
          {empresas.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-medium mb-1">Senha:</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Papel:</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="FUNCIONARIO">Funcionário</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <div className="flex gap-4 mt-2">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Salvar
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};

export default FormUsuario;
