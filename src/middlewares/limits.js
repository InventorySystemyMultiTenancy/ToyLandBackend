import PLANS from "../config/plans.js";
import { Loja, Usuario, Empresa } from "../models/index.js";

const recursosMap = {
  lojas: Loja,
  usuarios: Usuario,
};

export function verificarLimites(recurso) {
  return async (req, res, next) => {
    try {
      const empresaId = req.empresaId;
      const empresa = await Empresa.findByPk(empresaId);
      if (!empresa) {
        return res.status(403).json({ error: "Empresa não encontrada" });
      }
      const plano = empresa.plano || "BASIC";
      const limites = PLANS[plano] || PLANS.BASIC;
      const Model = recursosMap[recurso];
      if (!Model) {
        return res
          .status(500)
          .json({ error: "Recurso não suportado para limite" });
      }
      const count = await Model.count({ where: { empresaId } });
      const max =
        limites[`max${recurso.charAt(0).toUpperCase() + recurso.slice(1)}`];
      if (typeof max === "number" && count >= max) {
        return res
          .status(403)
          .json({
            error: "Limite do plano atingido. Faça upgrade para continuar.",
          });
      }
      next();
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Erro ao verificar limites do plano" });
    }
  };
}
