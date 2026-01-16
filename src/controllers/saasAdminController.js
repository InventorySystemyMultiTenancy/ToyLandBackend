import { Empresa, Usuario, sequelize } from "../models/index.js";
import bcrypt from "bcryptjs";

export const criarNovaEmpresa = async (req, res) => {
  const { nome, plano, usuario } = req.body;
  if (
    !nome ||
    !plano ||
    !usuario ||
    !usuario.nome ||
    !usuario.email ||
    !usuario.senha
  ) {
    return res.status(400).json({ error: "Dados obrigatórios não informados" });
  }
  const t = await sequelize.transaction();
  try {
    // Cria empresa
    const empresa = await Empresa.create(
      {
        nome,
        plano,
        ativo: true,
      },
      { transaction: t }
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
      { transaction: t }
    );

    await t.commit();
    res.status(201).json({ empresa, usuario: novoUsuario });
  } catch (error) {
    await t.rollback();
    res
      .status(500)
      .json({
        error: "Erro ao criar empresa e usuário",
        detalhes: error.message,
      });
  }
};
