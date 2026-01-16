import { Empresa, Usuario } from "../models/index.js";
import { sequelize } from "../database/connection.js";
import bcrypt from "bcryptjs";

// Função auxiliar para gerar subdomain a partir do nome
const gerarSubdomain = (nome) => {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]/g, "-") // Substitui caracteres especiais por -
    .replace(/-+/g, "-") // Remove hífens duplicados
    .replace(/^-|-$/g, ""); // Remove hífens do início e fim
};

export const criarNovaEmpresa = async (req, res) => {
  const { nome, cnpj, plano, email, usuario } = req.body;

  // Validações
  if (
    !nome ||
    !cnpj ||
    !plano ||
    !usuario ||
    !usuario.nome ||
    !usuario.email ||
    !usuario.senha
  ) {
    return res.status(400).json({
      error: "Dados obrigatórios não informados",
      required: [
        "nome",
        "cnpj",
        "plano",
        "usuario.nome",
        "usuario.email",
        "usuario.senha",
      ],
    });
  }

  const t = await sequelize.transaction();
  try {
    // Gera subdomain único
    let subdomain = gerarSubdomain(nome);
    let tentativa = 1;

    // Verifica se já existe e adiciona número se necessário
    while (await Empresa.findOne({ where: { subdomain } })) {
      subdomain = `${gerarSubdomain(nome)}-${tentativa}`;
      tentativa++;
    }

    // Verifica se CNPJ já existe
    const cnpjExiste = await Empresa.findOne({ where: { cnpj } });
    if (cnpjExiste) {
      await t.rollback();
      return res.status(400).json({ error: "CNPJ já cadastrado" });
    }

    // Cria empresa
    const empresa = await Empresa.create(
      {
        nome,
        cnpj,
        email,
        plano,
        subdomain,
        ativo: true,
        configuracoes: {},
      },
      { transaction: t },
    );

    // Cria usuário admin da empresa
    const senhaHash = await bcrypt.hash(usuario.senha, 10);
    const novoUsuario = await Usuario.create(
      {
        nome: usuario.nome,
        email: usuario.email,
        senha: senhaHash,
        role: "ADMIN",
        empresaId: empresa.id,
        ativo: true,
      },
      { transaction: t },
    );

    await t.commit();

    // Remove senha do retorno
    const { senha, ...usuarioSemSenha } = novoUsuario.toJSON();

    res.status(201).json({
      empresa,
      usuario: usuarioSemSenha,
      message: "Empresa e usuário criados com sucesso",
    });
  } catch (error) {
    await t.rollback();
    console.error("Erro ao criar empresa:", error);
    res.status(500).json({
      error: "Erro ao criar empresa e usuário",
      detalhes: error.message,
    });
  }
};
