// CORREÇÃO 1: Adicionei 'Movimentacao' e 'Empresa' na importação
import { LogAtividade, AlertaIgnorado, Movimentacao, Empresa } from "../models/index.js";
import { Op } from "sequelize";

/**
 * Limpa dados antigos de LogAtividade e AlertaIgnorado (apenas registros com createdAt < 30 dias atrás)
 * NÃO remove dados de vendas, movimentações ou financeiros.
 */
export const limparDadosAntigos = async () => { // <--- ESTA LINHA ESTAVA FALTANDO
  try {
    // Busca todas as empresas ativas para aplicar regras específicas se necessário
    const empresas = await Empresa.findAll({ where: { ativo: true } });
    
    let totalLogs = 0;
    let totalAlertas = 0;

    console.log(`🗑️  Iniciando limpeza Multi-tenant para ${empresas.length} empresas...`);

    for (const empresa of empresas) {
      try {
        // Regra de Negócio: Plano PRO retém por 90 dias, outros por 30
        let diasRetencao = 30;
        if (empresa.plano === "PRO") diasRetencao = 90;

        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - diasRetencao);

        // Limpa Logs da Empresa
        const logsExcluidos = await LogAtividade.destroy({
          where: {
            empresaId: empresa.id, // Garanta que esta coluna existe no banco
            createdAt: { [Op.lt]: dataLimite },
          },
        });

        // Limpa Alertas Ignorados da Empresa
        const alertasExcluidos = await AlertaIgnorado.destroy({
          where: {
            empresaId: empresa.id, // Garanta que esta coluna existe no banco
            createdAt: { [Op.lt]: dataLimite },
          },
        });

        totalLogs += logsExcluidos;
        totalAlertas += alertasExcluidos;

        if (logsExcluidos > 0 || alertasExcluidos > 0) {
            console.log(`   🏢 ${empresa.nome} (Plano: ${empresa.plano}): -${logsExcluidos} logs, -${alertasExcluidos} alertas (Corte: ${dataLimite.toISOString().split('T')[0]})`);
        }

      } catch (errEmpresa) {
        console.error(`   ❌ Erro ao limpar dados da empresa ${empresa.nome}:`, errEmpresa.message);
      }
    }

    console.log(`✅ Limpeza concluída: ${totalLogs} logs e ${totalAlertas} alertas removidos no total.`);
    
    return {
      sucesso: true,
      totalLogs,
      totalAlertas,
      totalExcluido: totalLogs + totalAlertas,
    };
  } catch (error) {
    console.error("❌ Erro global ao limpar dados antigos:", error);
    throw error;
  }
};

/**
 * Verifica quantos registros seriam excluídos (dry run)
 * NOTA: Esta função verifica dados de 5 ANOS atrás por padrão.
 */
export const verificarDadosParaLimpeza = async () => {
  try {
    const cincoAnosAtras = new Date();
    cincoAnosAtras.setDate(cincoAnosAtras.getDate() - 1825); // 5 anos

    // Contagem global (sem filtro de empresa aqui, apenas para ter noção do volume antigo)
    const movimentacoesAntigas = await Movimentacao.count({
      where: {
        dataColeta: {
          [Op.lt]: cincoAnosAtras,
        },
      },
    });

    const logsAntigos = await LogAtividade.count({
      where: {
        createdAt: {
          [Op.lt]: cincoAnosAtras,
        },
      },
    });

    return {
      dataLimite: cincoAnosAtras,
      movimentacoesParaExcluir: movimentacoesAntigas,
      logsParaExcluir: logsAntigos,
      totalParaExcluir: movimentacoesAntigas + logsAntigos,
    };
  } catch (error) {
    console.error("Erro ao verificar dados para limpeza:", error);
    throw error;
  }
};