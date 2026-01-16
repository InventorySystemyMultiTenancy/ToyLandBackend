import axios from "axios";

const API_URL = process.env.API_URL || "http://localhost:3001/api";

async function main() {
  try {
    // 1. Criar Empresa A e usuário A
    const empresaA = await axios.post(
      `${API_URL}/saas/empresas`,
      {
        nome: "Empresa A",
        plano: "BASIC",
        usuario: { nome: "UserA", email: "usera@a.com", senha: "123456" },
      },
      { headers: { Authorization: `Bearer ${process.env.SUPER_ADMIN_TOKEN}` } }
    );
    const userA = empresaA.data.usuario;
    // 2. Criar Empresa B e usuário B
    const empresaB = await axios.post(
      `${API_URL}/saas/empresas`,
      {
        nome: "Empresa B",
        plano: "BASIC",
        usuario: { nome: "UserB", email: "userb@b.com", senha: "123456" },
      },
      { headers: { Authorization: `Bearer ${process.env.SUPER_ADMIN_TOKEN}` } }
    );
    const userB = empresaB.data.usuario;

    // 3. Login UserA
    const loginA = await axios.post(`${API_URL}/auth/login`, {
      email: "usera@a.com",
      senha: "123456",
    });
    const tokenA = loginA.data.token;
    // 4. Login UserB
    const loginB = await axios.post(`${API_URL}/auth/login`, {
      email: "userb@b.com",
      senha: "123456",
    });
    const tokenB = loginB.data.token;

    // 5. Criar loja na Empresa A
    const lojaA = await axios.post(
      `${API_URL}/lojas`,
      {
        nome: "Loja A",
        endereco: "Rua 1",
        cidade: "Cidade A",
        estado: "AA",
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    const lojaAId = lojaA.data.id || lojaA.data.loja?.id;

    // 6. UserB tenta acessar loja da Empresa A
    let isolationOk = false;
    try {
      await axios.get(`${API_URL}/lojas/${lojaAId}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      // Se não lançar erro, falhou
      console.error(
        "FALHA CRÍTICA DE ISOLAMENTO: UserB acessou loja da Empresa A!"
      );
      process.exit(1);
    } catch (err) {
      if (
        err.response &&
        (err.response.status === 403 || err.response.status === 404)
      ) {
        isolationOk = true;
        console.log("Isolamento multi-tenant OK: acesso negado como esperado.");
      } else {
        console.error("Erro inesperado:", err.message);
        process.exit(1);
      }
    }
    if (isolationOk) process.exit(0);
  } catch (error) {
    console.error("Erro no teste de isolamento:", error.message);
    process.exit(1);
  }
}

main();
