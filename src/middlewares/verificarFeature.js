const PLANS = require("../config/plans");
const { Empresa } = require("../models");

function verificarFeature(nomeFeature) {
  return async function (req, res, next) {
    // empresaId deve estar disponível no req (middleware de autenticação)
    const empresaId = req.empresaId || req.empresa?.id;
    if (!empresaId)
      return res.status(403).json({ error: "Empresa não identificada" });
    const empresa = req.empresa || (await Empresa.findByPk(empresaId));
    if (!empresa)
      return res.status(404).json({ error: "Empresa não encontrada" });
    const plano = empresa.plano || "BASIC";
    const features = (PLANS[plano] && PLANS[plano].features) || [];
    if (!features.includes(nomeFeature)) {
      return res
        .status(403)
        .json({ error: "Funcionalidade não disponível no seu plano" });
    }
    next();
  };
}

module.exports = verificarFeature;
