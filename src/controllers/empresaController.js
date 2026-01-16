import { Empresa } from "../models/index.js";

// Buscar empresa por subdomínio
export const buscarPorSubdominio = async (req, res) => {
  try {
    const { subdomain } = req.params;
    if (!subdomain) {
      return res.status(400).json({ error: "Subdomínio não informado" });
    }
    const empresa = await Empresa.findOne({ where: { subdomain } });
    if (!empresa) {
      return res
        .status(404)
        .json({ error: "Empresa não encontrada para este subdomínio" });
    }
    res.json(empresa);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar empresa por subdomínio" });
  }
};
