import { useAuth } from "../contexts/AuthContext";

/**
 * Hook para verificar se a empresa atual possui determinada feature liberada pelo plano
 * @param {string} nomeFeature
 * @returns {boolean}
 */
export function useFeature(nomeFeature) {
  const { empresa } = useAuth();
  if (!empresa || !empresa.plano) return false;
  // Features dos planos devem ser mantidas em sincronia com o backend
  const featuresPorPlano = {
    BASIC: [
      "relatorios_simples",
      // outras features básicas
    ],
    PRO: [
      "relatorios_simples",
      "relatorios_avancados",
      "api_externa",
      "multi_loja",
    ],
  };
  const features = featuresPorPlano[empresa.plano] || [];
  return features.includes(nomeFeature);
}
