import RegistroDinheiro from "../models/RegistroDinheiro.js";

const registroDinheiroController = {
  async criar(req, res) {
    try {
      const {
        loja,
        maquina,
        inicio,
        fim,
        valorDinheiro,
        valorCartaoPix,
        observacoes,
      } = req.body;

      // Log dos dados recebidos
      console.log("[RegistrarDinheiro] Dados recebidos:", req.body);

      // Validação de campos obrigatórios
      if (!loja || !inicio || !fim || !maquina) {
        console.error("[RegistrarDinheiro] Campos obrigatórios ausentes");
        return res
          .status(400)
          .json({
            error: "Campos obrigatórios ausentes: loja, máquina, início e fim.",
          });
      }
      try {
        const registro = await RegistroDinheiro.create({
          lojaId: loja,
          maquinaId: maquina,
          inicio,
          fim,
          valorDinheiro: valorDinheiro || 0,
          valorCartaoPix: valorCartaoPix || 0,
          observacoes,
        });
        return res.status(201).json(registro);
      } catch (dbErr) {
        console.error("[RegistrarDinheiro] Erro ao salvar no banco:", dbErr);
        return res.status(500).json({
          error: "Erro ao registrar dinheiro",
          details: dbErr.message,
        });
      }
    } catch (err) {
      console.error("[RegistrarDinheiro] Erro inesperado:", err);
      return res
        .status(500)
        .json({ error: "Erro ao registrar dinheiro", details: err.message });
    }
  },

  // Novo endpoint: total da loja
  async totalLoja(req, res) {
    try {
      const { lojaId, inicio, fim } = req.query;
      if (!lojaId) {
        return res.status(400).json({ error: "lojaId é obrigatório" });
      }
      const where = { lojaId };
      if (inicio) where.inicio = { $gte: new Date(inicio) };
      if (fim) where.fim = { $lte: new Date(fim) };
      // Somar todos os registros de máquinas dessa loja
      const registros = await RegistroDinheiro.findAll({ where });
      const totalDinheiro = registros.reduce(
        (sum, r) => sum + parseFloat(r.valorDinheiro || 0),
        0,
      );
      const totalCartaoPix = registros.reduce(
        (sum, r) => sum + parseFloat(r.valorCartaoPix || 0),
        0,
      );
      return res.json({
        totalDinheiro,
        totalCartaoPix,
        total: totalDinheiro + totalCartaoPix,
      });
    } catch (err) {
      return res
        .status(500)
        .json({
          error: "Erro ao calcular total da loja",
          details: err.message,
        });
    }
  },

  async listar(req, res) {
    try {
      const registros = await RegistroDinheiro.findAll({
        order: [["createdAt", "DESC"]],
      });
      return res.json(registros);
    } catch (err) {
      return res
        .status(500)
        .json({ error: "Erro ao buscar registros", details: err.message });
    }
  },
};

export default registroDinheiroController;
