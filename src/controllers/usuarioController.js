import { Usuario, UsuarioLoja, Loja } from "../models/index.js";
import { Op } from "sequelize";

// Listar todos os usuários (apenas ADMIN)
export const listarUsuarios = async (req, res) => {
  try {
    const { role, ativo, busca } = req.query;
    let where = {};
    if (req.empresaId !== "000001") {
      where.empresaId = req.empresaId;
    }
    if (role) {
      where.role = role;
    }
    if (ativo !== undefined) {
      where.ativo = ativo === "true";
    }
    if (busca) {
      where[Op.or] = [
        { nome: { [Op.iLike]: `%${busca}%` } },
        { email: { [Op.iLike]: `%${busca}%` } },
      ];
    }
    const usuarios = await Usuario.findAll({
      where,
      include: [
        {
          model: UsuarioLoja,
          as: "permissoesLojas",
          include: [
            {
              model: Loja,
              attributes: ["id", "nome"],
            },
          ],
        },
      ],
      order: [["nome", "ASC"]],
    });

    res.json(usuarios);
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
};

// Obter usuário por ID (apenas ADMIN)
export const obterUsuario = async (req, res) => {
  try {
    const whereUsuario = { id: req.params.id };
    if (req.empresaId !== "000001") {
      whereUsuario.empresaId = req.empresaId;
    }
    const usuario = await Usuario.findOne({
      where: whereUsuario,
      include: [
        {
          model: UsuarioLoja,
          as: "permissoesLojas",
          include: [
            {
              model: Loja,
              attributes: ["id", "nome"],
            },
          ],
        },
      ],
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json(usuario);
  } catch (error) {
    console.error("Erro ao obter usuário:", error);
    res.status(500).json({ error: "Erro ao obter usuário" });
  }
};

// Criar novo usuário (apenas ADMIN)
export const criarUsuario = async (req, res) => {
  try {
    const { nome, email, senha, telefone, role, lojasPermitidas } = req.body;
    console.log("Dados recebidos para criar usuário:", req.body);

    if (!nome || !email || !senha) {
      console.warn("Faltando campos obrigatórios:", { nome, email, senha });
      return res
        .status(400)
        .json({ error: "Nome, email e senha são obrigatórios" });
    }

    // Impedir criação de SUPER_ADMIN por admin comum
    if (role === "SUPER_ADMIN") {
      console.warn("Tentativa de criar SUPER_ADMIN:", req.body);
      return res
        .status(403)
        .json({ error: "Não é permitido criar usuários SUPER_ADMIN" });
    }

    // Validar role
    const roleValida = ["ADMIN", "FUNCIONARIO"].includes(role);
    if (!roleValida) {
      console.warn("Role inválida recebida:", role);
      return res
        .status(400)
        .json({ error: "Role inválida. Use ADMIN ou FUNCIONARIO" });
    }

    // Verificar se email já existe
    let usuarioExistente;
    if (req.usuario.role === "SUPER_ADMIN") {
      usuarioExistente = await Usuario.findOne({ where: { email } });
    } else {
      usuarioExistente = await Usuario.findOne({
        where: { email, empresaId: req.empresaId },
      });
    }
    if (usuarioExistente) {
      console.warn("Email já cadastrado:", email);
      return res.status(400).json({ error: "Email já cadastrado" });
    }

    // Definir empresaId
    let empresaId = req.empresaId;
    if (req.empresaId === "000001") {
      if (!req.body.empresaId) {
        console.warn("SUPER_ADMIN não informou empresaId ao criar usuário");
        return res.status(400).json({
          error: "SUPER_ADMIN deve informar empresaId ao criar usuário",
        });
      }
      empresaId = req.body.empresaId;
    }

    // CRIAÇÃO DO USUÁRIO
    const usuario = await Usuario.create({
      nome,
      email,
      senha,
      telefone,
      role,
      empresaId,
    });

    // Se for funcionário e tiver lojas permitidas, criar permissões
    if (
      role === "FUNCIONARIO" &&
      lojasPermitidas &&
      lojasPermitidas.length > 0
    ) {
      const permissoes = lojasPermitidas.map((lojaId) => ({
        usuarioId: usuario.id,
        lojaId,
        permissoes: {
          visualizar: true,
          editar: false,
          registrarMovimentacao: true,
        },
      }));
      await UsuarioLoja.bulkCreate(permissoes);
    }

    // Buscar usuário completo com permissões para retornar
    const usuarioCompleto = await Usuario.findByPk(usuario.id, {
      include: [
        {
          model: UsuarioLoja,
          as: "permissoesLojas",
          include: [
            {
              model: Loja,
              attributes: ["id", "nome"],
            },
          ],
        },
      ],
    });

    res.status(201).json(usuarioCompleto);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
};

// Atualizar usuário (Recuperado e corrigido)
export const atualizarUsuario = async (req, res) => {
  try {
    const { nome, email, telefone, role, lojasPermitidas, ativo } = req.body;
    const whereUsuario = { id: req.params.id };
    if (req.empresaId !== "000001") {
      whereUsuario.empresaId = req.empresaId;
    }
    const usuario = await Usuario.findOne({ where: whereUsuario });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Atualiza dados básicos
    await usuario.update({
      nome,
      email,
      telefone,
      role,
      ativo,
    });

    // Gerenciar permissões de loja
    if (lojasPermitidas !== undefined) {
      // Remover permissões antigas
      await UsuarioLoja.destroy({ where: { usuarioId: usuario.id } });

      // Adicionar novas permissões (apenas se for FUNCIONARIO e houver lojas)
      if (
        (role || usuario.role) === "FUNCIONARIO" &&
        lojasPermitidas.length > 0
      ) {
        const permissoes = lojasPermitidas.map((lojaId) => ({
          usuarioId: usuario.id,
          lojaId,
          permissoes: {
            visualizar: true,
            editar: false,
            registrarMovimentacao: true,
          },
        }));

        await UsuarioLoja.bulkCreate(permissoes);
      }
    }

    // Buscar usuário atualizado com permissões
    const usuarioAtualizado = await Usuario.findByPk(usuario.id, {
      include: [
        {
          model: UsuarioLoja,
          as: "permissoesLojas",
          include: [
            {
              model: Loja,
              attributes: ["id", "nome"],
            },
          ],
        },
      ],
    });

    res.json(usuarioAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
};

// Deletar usuário (apenas ADMIN)
export const deletarUsuario = async (req, res) => {
  try {
    const whereUsuario = { id: req.params.id };
    if (req.empresaId !== "000001") {
      whereUsuario.empresaId = req.empresaId;
    }
    const usuario = await Usuario.findOne({ where: whereUsuario });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Não permitir deletar a si mesmo
    if (usuario.id === req.usuario.id) {
      return res
        .status(400)
        .json({ error: "Você não pode deletar sua própria conta" });
    }

    // Soft delete
    await usuario.update({ ativo: false });

    res.json({ message: "Usuário desativado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    res.status(500).json({ error: "Erro ao deletar usuário" });
  }
};

// Reativar usuário (apenas ADMIN)
export const reativarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    await usuario.update({ ativo: true });

    res.json({ message: "Usuário reativado com sucesso", usuario });
  } catch (error) {
    console.error("Erro ao reativar usuário:", error);
    res.status(500).json({ error: "Erro ao reativar usuário" });
  }
};
