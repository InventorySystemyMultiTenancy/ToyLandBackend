import { Loja, Maquina, UsuarioLoja } from "../models/index.js";

// US04 - Listar todas as lojas
export const listarLojas = async (req, res) => {
  try {
    console.log("[LOJAS] Listando lojas para empresaId:", req.empresaId);
    console.log("[LOJAS] Usuário:", req.usuario?.email);

    let where = {};
    if (req.empresaId !== "000001") {
      where.empresaId = req.empresaId;
    }

    console.log("[LOJAS] Filtro WHERE:", JSON.stringify(where));

    const lojas = await Loja.findAll({
      where,
      include: [
        {
          model: Maquina,
          as: "maquinas",
          attributes: ["id", "codigo", "nome", "tipo", "ativo"],
        },
      ],
      order: [["nome", "ASC"]],
    });

    console.log("[LOJAS] Retornando", lojas.length, "lojas");
    res.json(lojas);
  } catch (error) {
    console.error("Erro ao listar lojas:", error);
    res.status(500).json({ error: "Erro ao listar lojas" });
  }
};

// US04 - Obter loja por ID
export const obterLoja = async (req, res) => {
  try {
    let where = { id: req.params.id };
    if (req.empresaId !== "000001") {
      where.empresaId = req.empresaId;
    }
    const loja = await Loja.findOne({
      where,
      include: [
        {
          model: Maquina,
          as: "maquinas",
        },
      ],
    });
    if (!loja) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }
    res.json(loja);
  } catch (error) {
    console.error("Erro ao obter loja:", error);
    res.status(500).json({ error: "Erro ao obter loja" });
  }
};

// US04 - Criar loja
export const criarLoja = async (req, res) => {
  try {
    const { nome, endereco, cidade, estado, responsavel, telefone } = req.body;

    if (!nome) {
      return res.status(400).json({ error: "Nome da loja é obrigatório" });
    }

    let empresaId = req.empresaId;
    if (req.empresaId === "000001") {
      if (!req.body.empresaId) {
        return res
          .status(400)
          .json({ error: "SUPER_ADMIN deve informar empresaId ao criar loja" });
      }
      empresaId = req.body.empresaId;
    }
    const loja = await Loja.create({
      nome,
      endereco,
      cidade,
      estado,
      responsavel,
      telefone,
      empresaId,
    });

    res.locals.entityId = loja.id;
    res.status(201).json(loja);
  } catch (error) {
    console.error("Erro ao criar loja:", error);
    res.status(500).json({ error: "Erro ao criar loja" });
  }
};

// US04 - Atualizar loja
export const atualizarLoja = async (req, res) => {
  try {
    let where = { id: req.params.id };
    if (req.empresaId !== "000001") {
      where.empresaId = req.empresaId;
    }
    const loja = await Loja.findOne({
      where,
    });
    if (!loja) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }
    const { nome, endereco, cidade, estado, responsavel, telefone, ativo } =
      req.body;
    await loja.update({
      nome: nome ?? loja.nome,
      endereco: endereco ?? loja.endereco,
      cidade: cidade ?? loja.cidade,
      estado: estado ?? loja.estado,
      responsavel: responsavel ?? loja.responsavel,
      telefone: telefone ?? loja.telefone,
      ativo: ativo ?? loja.ativo,
    });
    res.json(loja);
  } catch (error) {
    console.error("Erro ao atualizar loja:", error);
    res.status(500).json({ error: "Erro ao atualizar loja" });
  }
};

// US04 - Deletar loja
export const deletarLoja = async (req, res) => {
  try {
    let where = { id: req.params.id };
    if (req.empresaId !== "000001") {
      where.empresaId = req.empresaId;
    }
    const loja = await Loja.findOne({
      where,
    });
    if (!loja) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }
    // Verificar se já está inativa (segunda tentativa = hard delete)
    if (!loja.ativo) {
      // Hard delete - deletar permanentemente
      await Maquina.destroy({ where: { lojaId: loja.id } });
      await loja.destroy();
      return res.json({ message: "Loja deletada permanentemente" });
    }
    // Primeira tentativa: Soft delete (marcar como inativo)
    await loja.update({ ativo: false });
    res.json({ message: "Loja desativada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar loja:", error);
    res.status(500).json({ error: "Erro ao deletar loja" });
  }
};
