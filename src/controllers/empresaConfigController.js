import { Empresa } from "../models/index.js";

// Atualizar configurações da empresa logada
export const atualizarConfiguracoes = async (req, res) => {
  try {
    if (req.empresaId === "000001") {
      return res
        .status(400)
        .json({
          error:
            "SUPER_ADMIN deve selecionar uma empresa para atualizar configurações",
        });
    }
    const empresa = await Empresa.findByPk(req.empresaId);
    if (!empresa) {
      return res.status(404).json({ error: "Empresa não encontrada" });
    }
    // Apenas campos permitidos
    const { logoUrl, corPrimaria, textoRodapeRelatorio, fusoHorario } =
      req.body;
    empresa.configuracoes = {
      ...empresa.configuracoes,
      ...(logoUrl !== undefined ? { logoUrl } : {}),
      ...(corPrimaria !== undefined ? { corPrimaria } : {}),
      ...(textoRodapeRelatorio !== undefined ? { textoRodapeRelatorio } : {}),
      ...(fusoHorario !== undefined ? { fusoHorario } : {}),
    };
    await empresa.save();
    res.json({ sucesso: true, configuracoes: empresa.configuracoes });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erro ao atualizar configurações da empresa" });
  }
};
