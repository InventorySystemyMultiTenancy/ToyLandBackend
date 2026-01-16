import express from "express";
import BillingService from "../services/BillingService.js";

const router = express.Router();

// Middleware para validar assinatura/segredo do gateway
function validarAssinatura(req, res, next) {
  const signature =
    req.headers["x-webhook-signature"] ||
    req.headers["x-asaas-signature"] ||
    req.headers["stripe-signature"];
  const expectedSecret = process.env.WEBHOOK_SECRET;
  if (!expectedSecret)
    return res.status(500).json({ error: "Webhook secret não configurado" });
  if (!signature || signature !== expectedSecret) {
    return res.status(401).json({ error: "Assinatura do webhook inválida" });
  }
  next();
}

// POST /api/webhooks/pagamentos
router.post("/pagamentos", validarAssinatura, async (req, res) => {
  try {
    const { event, data } = req.body;
    // Exemplo: data.email, data.externalId, data.novaDataExpiracao
    if (event === "PAYMENT_RECEIVED") {
      await BillingService.renovarPlano({
        email: data.email,
        externalId: data.externalId,
        novaDataExpiracao: data.novaDataExpiracao,
      });
    } else if (
      event === "SUBSCRIPTION_CANCELED" ||
      event === "PAYMENT_OVERDUE"
    ) {
      await BillingService.desativarEmpresa({
        email: data.email,
        externalId: data.externalId,
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
