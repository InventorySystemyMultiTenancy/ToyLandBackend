const PLANS = {
  BASIC: {
    maxLojas: 2,
    maxUsuarios: 3,
    features: [
      "relatorios_simples",
      // outras features básicas
    ],
    descricao: "Plano básico",
  },
  PRO: {
    maxLojas: 10,
    maxUsuarios: 99,
    features: [
      "relatorios_simples",
      "relatorios_avancados",
      "api_externa",
      "multi_loja",
    ],
    descricao: "Plano profissional",
  },
};

export default PLANS;
