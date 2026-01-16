import express from "express";
import { autenticar, verificarSuperAdmin } from "../middlewares/auth.js";
import models from "../models/index.js";
const { Empresa } = models;

const router = express.Router();

// Listar todas as empresas
router.get("/empresas", autenticar, verificarSuperAdmin, async (req, res) => {
  const empresas = await Empresa.findAll();
  res.json(empresas);
});

// Detalhes de uma empresa
router.get(
  "/empresas/:id",
  autenticar,
  verificarSuperAdmin,
  async (req, res) => {
    const empresa = await Empresa.findByPk(req.params.id);
    if (!empresa)
      return res.status(404).json({ error: "Empresa não encontrada" });
    res.json(empresa);
  }
);

// Alterar plano da empresa
router.patch(
  "/empresas/:id/plano",
  autenticar,
  verificarSuperAdmin,
  async (req, res) => {
    const { plano } = req.body;
    const empresa = await Empresa.findByPk(req.params.id);
    if (!empresa)
      return res.status(404).json({ error: "Empresa não encontrada" });
    empresa.plano = plano;
    await empresa.save();
    res.json({ success: true, empresa });
  }
);

// Ativar/desativar empresa
router.patch(
  "/empresas/:id/ativo",
  autenticar,
  verificarSuperAdmin,
  async (req, res) => {
    const { ativo } = req.body;
    const empresa = await Empresa.findByPk(req.params.id);
    if (!empresa)
      return res.status(404).json({ error: "Empresa não encontrada" });
    empresa.ativo = !!ativo;
    await empresa.save();
    res.json({ success: true, empresa });
  }
);

export default router;
