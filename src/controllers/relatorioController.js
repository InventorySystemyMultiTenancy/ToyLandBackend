// Dashboard agregador via SQL
import { Sequelize, Op, fn, col } from "sequelize";

export const dashboardRelatorio = async (req, res) => {
  try {
    const { lojaId, dataInicio, dataFim } = req.query;
    // Buscar configurações da empresa
    const { Empresa, Movimentacao, MovimentacaoProduto, Maquina, Produto } =
      await import("../models/index.js");
    const empresa = await Empresa.findByPk(req.empresaId);

    // 1. Configuração de Datas
    const fim = dataFim ? new Date(`${dataFim}T23:59:59`) : new Date();
    const inicio = dataInicio
      ? new Date(`${dataInicio}T00:00:00`)
      : new Date(new Date().setDate(fim.getDate() - 30));

    // 2. Configuração de filtros WHERE
    const whereMovimentacao = {
      empresaId: req.empresaId,
      dataColeta: {
        [Op.between]: [inicio, fim],
      },
    };

    const whereMaquina = {
      empresaId: req.empresaId,
    };
    if (lojaId) {
      whereMaquina.lojaId = lojaId;
    }

    // --- QUERY 1: TOTAIS GERAIS ---
    const totaisRaw = await Movimentacao.findOne({
      attributes: [
        [fn("SUM", col("valorfaturado")), "faturamento"],
        [fn("SUM", col("sairam")), "saidas"],
        [fn("SUM", col("fichas")), "fichas"],
        [fn("SUM", col("quantidade_notas_entrada")), "dinheiro"],
        [fn("SUM", col("valor_entrada_maquininha_pix")), "pix"],
      ],
      include: [
        {
          model: Maquina,
          as: "maquina",
          where: whereMaquina,
          attributes: [],
        },
      ],
      where: whereMovimentacao,
      raw: true,
    });

    const faturamento = parseFloat(totaisRaw?.faturamento || 0);
    const saidas = parseInt(totaisRaw?.saidas || 0);
    const dinheiro = parseFloat(totaisRaw?.dinheiro || 0);
    const pix = parseFloat(totaisRaw?.pix || 0);
    const fichas = parseInt(totaisRaw?.fichas || 0);

    // --- QUERY 2: CUSTO TOTAL (estimativa via produtos abastecidos) ---
    const custoRaw = await MovimentacaoProduto.findOne({
      attributes: [
        [
          fn(
            "SUM",
            Sequelize.literal(
              '"quantidadeabastecida" * "produto"."custounitario"',
            ),
          ),
          "custoTotal",
        ],
      ],
      include: [
        { model: Produto, as: "produto", attributes: [] },
        {
          model: Movimentacao,
          attributes: [],
          where: whereMovimentacao,
          include: [
            {
              model: Maquina,
              as: "maquina",
              where: whereMaquina,
              attributes: [],
            },
          ],
        },
      ],
      raw: true,
    });

    const custo = parseFloat(custoRaw?.custoTotal || 0);
    const lucro = faturamento - custo;

    // --- QUERY 3: GRÁFICO FINANCEIRO (Timeline por dia) ---
    const timelineRaw = await Movimentacao.findAll({
      attributes: [
        [fn("DATE", col("dataColeta")), "data"],
        [fn("SUM", col("valorfaturado")), "faturamento"],
      ],
      include: [
        {
          model: Maquina,
          as: "maquina",
          where: whereMaquina,
          attributes: [],
        },
      ],
      where: whereMovimentacao,
      group: [fn("DATE", col("dataColeta"))],
      order: [[fn("DATE", col("dataColeta")), "ASC"]],
      raw: true,
    });

    // --- QUERY 4: PERFORMANCE POR MÁQUINA ---
    const performanceRaw = await Movimentacao.findAll({
      attributes: [
        [Sequelize.col("maquina.id"), "id"],
        [Sequelize.col("maquina.nome"), "nome"],
        [Sequelize.col("maquina.capacidadepadrao"), "capacidadePadrao"],
        [Sequelize.fn("SUM", Sequelize.col("valorfaturado")), "faturamento"],
      ],
      include: [
        {
          model: Maquina,
          as: "maquina",
          attributes: [],
        },
      ],
      where: whereMovimentacao,
      group: ["maquina.id", "maquina.nome", "maquina.capacidadepadrao"],
      raw: true,
      nest: true,
    });

    // Para calcular ocupação, precisamos buscar o estoque atual (última movimentação)
    // Fazemos isso em paralelo para cada máquina encontrada
    const performanceMaquinas = await Promise.all(
      performanceRaw.map(async (p) => {
        // Busca a última movimentação dessa máquina para pegar o estoque real
        const ultimaMov = await Movimentacao.findOne({
          where: { maquinaId: p.id },
          order: [["dataColeta", "DESC"]],
          attributes: ["totalPos"],
        });

        const estoqueAtual = ultimaMov ? ultimaMov.totalPos : 0;
        const capacidade = p.capacidadePadrao || 100;

        return {
          nome: p.nome,
          faturamento: parseFloat(p.faturamento || 0),
          ocupacao: ((estoqueAtual / capacidade) * 100).toFixed(1),
        };
      }),
    );

    // --- QUERY 5: RANKING DE PRODUTOS ---
    const rankingRaw = await MovimentacaoProduto.findAll({
      attributes: [
        [col("produto.nome"), "nome"],
        [fn("SUM", col("quantidadesaiu")), "quantidade"],
      ],
      include: [
        { model: Produto, as: "produto", attributes: ["id", "nome"] },
        {
          model: Movimentacao,
          attributes: [],
          where: whereMovimentacao,
          include: [
            {
              model: Maquina,
              as: "maquina",
              where: whereMaquina,
              attributes: [],
            },
          ],
        },
      ],
      group: ["produto.id", "produto.nome"],
      order: [[fn("SUM", col("quantidadesaiu")), "DESC"]],
      limit: 10,
      raw: true,
    });

    const rankingProdutos = rankingRaw.map((r) => ({
      nome: r.nome || "Desconhecido",
      quantidade: parseInt(r.quantidade || 0),
    }));

    // --- RESPOSTA FINAL ---
    res.json({
      totais: {
        faturamento,
        lucro,
        saidas,
        fichas,
        dinheiro,
        pix,
      },
      graficoFinanceiro: timelineRaw.map((t) => ({
        data: t.data,
        faturamento: parseFloat(t.faturamento || 0),
        custo: 0,
      })),
      performanceMaquinas,
      rankingProdutos,
    });
  } catch (error) {
    console.error("Erro Crítico no Dashboard:", error);
    res.status(500).json({
      error: "Erro interno ao processar dashboard.",
      details: error.message,
    });
  }
};
import {
  Movimentacao,
  MovimentacaoProduto,
  Maquina,
  Loja,
  Produto,
  AlertaIgnorado,
} from "../models/index.js";
// Alertas de inconsistência de movimentação
export const buscarAlertasDeInconsistencia = async (req, res) => {
  console.log("--- INICIANDO ALERTAS DE INCONSISTÊNCIA ---");
  console.log("[ALERTAS] EmpresaId:", req.empresaId);
  console.log("[ALERTAS] UsuarioId:", req.usuario?.id);
  try {
    const usuarioId = req.usuario?.id;

    // Filtrar máquinas por empresa (exceto SUPER_ADMIN)
    const whereMaquinas = { ativo: true };
    if (req.empresaId !== "000001") {
      whereMaquinas.empresaId = req.empresaId;
    }
    console.log("[ALERTAS] Where máquinas:", JSON.stringify(whereMaquinas));

    const maquinas = await Maquina.findAll({ where: whereMaquinas });
    console.log("[ALERTAS] Máquinas encontradas:", maquinas.length);
    const alertas = [];

    // Buscar alertas ignorados pelo usuário
    const ignorados = await AlertaIgnorado.findAll({
      where: usuarioId ? { usuarioId } : {},
    });
    console.log("[ALERTAS] Alertas ignorados:", ignorados.length);
    console.log("[ALERTAS] Alertas ignorados:", ignorados.length);
    const ignoradosSet = new Set(ignorados.map((a) => a.alertaId));

    console.log("[ALERTAS] Iniciando loop de máquinas...");
    for (const maquina of maquinas) {
      console.log(
        `[ALERTAS] Processando máquina ${maquina.id} - ${maquina.nome}`,
      );
      // Busca as duas últimas movimentações da máquina, ordenadas por data decrescente
      const movimentacoes = await Movimentacao.findAll({
        where: { maquinaId: maquina.id },
        order: [["dataColeta", "DESC"]],
        limit: 2,
        attributes: [
          "id",
          "contadorIn",
          "contadorOut",
          "fichas",
          "sairam",
          "dataColeta",
        ],
      });

      if (movimentacoes.length === 2) {
        const atual = movimentacoes[0]; // mais recente
        const anterior = movimentacoes[1];

        // OUT: diferença do campo contadorOut
        const diffOut = (atual.contadorOut || 0) - (anterior.contadorOut || 0);
        const diffIn = (atual.contadorIn || 0) - (anterior.contadorIn || 0);

        const alertaId = `${maquina.id}-${atual.id}`;

        // Se a diferença não bate com a quantidade de saída/fichas
        if (
          (diffOut !== (atual.sairam || 0) || diffIn !== (atual.fichas || 0)) &&
          !ignoradosSet.has(alertaId) &&
          !(atual.contadorOut === 0 && atual.contadorIn === 0)
        ) {
          alertas.push({
            id: alertaId,
            maquinaId: maquina.id,
            maquinaNome: maquina.nome,
            contador_out: atual.contadorOut || 0,
            contador_in: atual.contadorIn || 0,
            fichas: atual.fichas,
            dataMovimentacao: atual.dataColeta,
            mensagem: `Inconsistência detectada: OUT (${diffOut}) esperado ${
              atual.sairam
            }, IN (${diffIn}) esperado ${atual.fichas}.\nOUT registrado: ${
              atual.contadorOut || 0
            } | IN registrado: ${atual.contadorIn || 0} | Fichas: ${
              atual.fichas
            }`,
          });
        }
      }
    }

    console.log("[ALERTAS] Alertas encontrados:", alertas.length);
    res.json({ alertas });
  } catch (error) {
    console.error("[ALERTAS] ERRO:", error);
    console.error("[ALERTAS] Stack:", error.stack);
    res.status(500).json({
      error: "Erro ao buscar alertas de movimentação",
      message: error.message,
    });
  }
};

// Endpoint para ignorar alerta
export const ignorarAlertaMovimentacao = async (req, res) => {
  try {
    const { id } = req.params; // alertaId
    const { maquinaId } = req.body;
    if (!maquinaId || !id) {
      return res.status(400).json({ error: "Dados obrigatórios ausentes." });
    }
    // Ignora alerta globalmente (sem usuarioId)
    await AlertaIgnorado.create({
      alertaId: id,
      maquinaId,
      usuarioId: null,
    });
    res.json({ success: true });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erro ao ignorar alerta", message: error.message });
  }
};
import { sequelize } from "../database/connection.js";

// US13 - Dashboard de Balanço Semanal
export const balançoSemanal = async (req, res) => {
  try {
    const { lojaId, dataInicio, dataFim } = req.query;

    console.log("[BALANÇO SEMANAL] EmpresaId:", req.empresaId);

    // Definir período padrão (últimos 7 dias)
    const fim = dataFim ? new Date(dataFim) : new Date();
    const inicio = dataInicio
      ? new Date(dataInicio)
      : new Date(fim.getTime() - 7 * 24 * 60 * 60 * 1000);

    const whereMovimentacao = {
      dataColeta: {
        [Op.between]: [inicio, fim],
      },
    };

    // Filtrar por empresa (exceto SUPER_ADMIN)
    if (req.empresaId !== "000001") {
      whereMovimentacao.empresaId = req.empresaId;
    }

    console.log("[BALANÇO SEMANAL] WHERE:", JSON.stringify(whereMovimentacao));

    const includeMaquina = {
      model: Maquina,
      as: "maquina",
      attributes: ["id", "codigo", "lojaId"],
      include: [
        {
          model: Loja,
          as: "loja",
          attributes: ["id", "nome"],
        },
      ],
    };

    if (lojaId) {
      includeMaquina.where = { lojaId };
    }

    // Buscar todas movimentações do período
    const movimentacoes = await Movimentacao.findAll({
      where: whereMovimentacao,
      include: [
        includeMaquina,
        {
          model: MovimentacaoProduto,
          as: "detalhesProdutos",
          include: [
            {
              model: Produto,
              as: "produto",
              attributes: ["id", "nome", "categoria"],
            },
          ],
        },
      ],
    });

    console.log(
      "[BALANÇO SEMANAL] Movimentações encontradas:",
      movimentacoes.length,
    );

    // Calcular totais gerais
    const totais = movimentacoes.reduce(
      (acc, mov) => {
        acc.totalFichas += mov.fichas || 0;
        acc.totalFaturamento += parseFloat(mov.valorFaturado || 0);
        acc.totalSairam += mov.sairam || 0;
        acc.totalAbastecidas += mov.abastecidas || 0;
        return acc;
      },
      {
        totalFichas: 0,
        totalFaturamento: 0,
        totalSairam: 0,
        totalAbastecidas: 0,
      },
    );

    // Calcular média fichas/prêmio
    totais.mediaFichasPremio =
      totais.totalSairam > 0
        ? (totais.totalFichas / totais.totalSairam).toFixed(2)
        : 0;

    // Agrupar por produto
    const produtosMap = {};
    movimentacoes.forEach((mov) => {
      mov.detalhesProdutos?.forEach((dp) => {
        const produtoNome = dp.produto?.nome || "Não especificado";
        if (!produtosMap[produtoNome]) {
          produtosMap[produtoNome] = {
            nome: produtoNome,
            quantidadeSaiu: 0,
            quantidadeAbastecida: 0,
          };
        }
        produtosMap[produtoNome].quantidadeSaiu += dp.quantidadeSaiu || 0;
        produtosMap[produtoNome].quantidadeAbastecida +=
          dp.quantidadeAbastecida || 0;
      });
    });

    // Calcular porcentagens
    const distribuicaoProdutos = Object.values(produtosMap)
      .map((p) => ({
        ...p,
        porcentagem:
          totais.totalSairam > 0
            ? ((p.quantidadeSaiu / totais.totalSairam) * 100).toFixed(2)
            : 0,
      }))
      .sort((a, b) => b.quantidadeSaiu - a.quantidadeSaiu);

    // Agrupar por loja
    const lojasMap = {};
    movimentacoes.forEach((mov) => {
      const lojaNome = mov.maquina?.loja?.nome || "Não especificado";
      if (!lojasMap[lojaNome]) {
        lojasMap[lojaNome] = {
          nome: lojaNome,
          fichas: 0,
          faturamento: 0,
          sairam: 0,
          abastecidas: 0,
        };
      }
      lojasMap[lojaNome].fichas += mov.fichas || 0;
      lojasMap[lojaNome].faturamento += parseFloat(mov.valorFaturado || 0);
      lojasMap[lojaNome].sairam += mov.sairam || 0;
      lojasMap[lojaNome].abastecidas += mov.abastecidas || 0;
    });

    const distribuicaoLojas = Object.values(lojasMap)
      .map((l) => ({
        ...l,
        mediaFichasPremio: l.sairam > 0 ? (l.fichas / l.sairam).toFixed(2) : 0,
      }))
      .sort((a, b) => b.faturamento - a.faturamento);

    res.json({
      periodo: {
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
      },
      totais,
      distribuicaoProdutos,
      distribuicaoLojas,
      totalMovimentacoes: movimentacoes.length,
    });
  } catch (error) {
    console.error("Erro ao gerar balanço semanal:", error);
    res.status(500).json({ error: "Erro ao gerar balanço semanal" });
  }
};

// US14 - Alertas de Estoque Baixo
export const alertasEstoque = async (req, res) => {
  try {
    const { lojaId } = req.query;
    const whereMaquina = { ativo: true };

    // Filtrar por empresa (exceto SUPER_ADMIN)
    if (req.empresaId !== "000001") {
      whereMaquina.empresaId = req.empresaId;
    }

    if (lojaId) {
      whereMaquina.lojaId = lojaId;
    }

    const maquinas = await Maquina.findAll({
      where: whereMaquina,
      include: [
        {
          model: Loja,
          as: "loja",
          attributes: ["id", "nome"],
        },
      ],
    });

    const alertas = [];

    for (const maquina of maquinas) {
      // Buscar última movimentação
      const ultimaMovimentacao = await Movimentacao.findOne({
        where: { maquinaId: maquina.id },
        order: [["dataColeta", "DESC"]],
      });

      const estoqueAtual = ultimaMovimentacao ? ultimaMovimentacao.totalPos : 0;
      const estoqueMinimo =
        (maquina.capacidadePadrao * maquina.percentualAlertaEstoque) / 100;
      const percentualAtual = (estoqueAtual / maquina.capacidadePadrao) * 100;

      if (estoqueAtual < estoqueMinimo) {
        alertas.push({
          maquina: {
            id: maquina.id,
            codigo: maquina.codigo,
            nome: maquina.nome,
            loja: maquina.loja?.nome,
          },
          estoqueAtual,
          capacidadePadrao: maquina.capacidadePadrao,
          estoqueMinimo,
          percentualAtual: percentualAtual.toFixed(2),
          percentualAlerta: maquina.percentualAlertaEstoque,
          nivelAlerta:
            percentualAtual < 10
              ? "CRÍTICO"
              : percentualAtual < 20
                ? "ALTO"
                : "MÉDIO",
          ultimaAtualizacao: ultimaMovimentacao?.dataColeta,
        });
      }
    }

    // Ordenar por percentual (mais críticos primeiro)
    alertas.sort(
      (a, b) => parseFloat(a.percentualAtual) - parseFloat(b.percentualAtual),
    );

    res.json({
      totalAlertas: alertas.length,
      alertas,
    });
  } catch (error) {
    console.error("Erro ao buscar alertas de estoque:", error);
    res.status(500).json({ error: "Erro ao buscar alertas de estoque" });
  }
};

// Relatório de performance por máquina
export const performanceMaquinas = async (req, res) => {
  try {
    const { lojaId, dataInicio, dataFim } = req.query;

    const fim = dataFim ? new Date(dataFim) : new Date();
    const inicio = dataInicio
      ? new Date(dataInicio)
      : new Date(fim.getTime() - 30 * 24 * 60 * 60 * 1000);

    const whereMovimentacao = {
      dataColeta: {
        [Op.between]: [inicio, fim],
      },
    };

    // Filtrar por empresa (exceto SUPER_ADMIN)
    if (req.empresaId !== "000001") {
      whereMovimentacao.empresaId = req.empresaId;
    }

    const whereMaquina = {};
    if (req.empresaId !== "000001") {
      whereMaquina.empresaId = req.empresaId;
    }
    if (lojaId) {
      whereMaquina.lojaId = lojaId;
    }

    const performance = await Movimentacao.findAll({
      attributes: [
        "maquinaId",
        [fn("COUNT", col("id")), "totalMovimentacoes"],
        [fn("SUM", col("fichas")), "totalFichas"],
        [fn("SUM", col("valorFaturado")), "totalFaturamento"],
        [fn("SUM", col("sairam")), "totalSairam"],
        [fn("AVG", col("mediaFichasPremio")), "mediaFichasPremioGeral"],
      ],
      where: whereMovimentacao,
      include: [
        {
          model: Maquina,
          as: "maquina",
          where: whereMaquina,
          attributes: ["id", "codigo", "nome", "tipo"],
          include: [
            {
              model: Loja,
              as: "loja",
              attributes: ["id", "nome"],
            },
          ],
        },
      ],
      group: ["maquinaId", "maquina.id", "maquina->loja.id"],
      order: [[fn("SUM", col("valorFaturado")), "DESC"]],
    });

    const resultado = performance.map((p) => ({
      maquina: {
        id: p.maquina.id,
        codigo: p.maquina.codigo,
        nome: p.maquina.nome,
        tipo: p.maquina.tipo,
        loja: p.maquina.loja?.nome,
      },
      metricas: {
        totalMovimentacoes: parseInt(p.getDataValue("totalMovimentacoes")),
        totalFichas: parseInt(p.getDataValue("totalFichas") || 0),
        totalFaturamento: parseFloat(p.getDataValue("totalFaturamento") || 0),
        totalSairam: parseInt(p.getDataValue("totalSairam") || 0),
        mediaFichasPremio: parseFloat(
          p.getDataValue("mediaFichasPremioGeral") || 0,
        ).toFixed(2),
      },
    }));

    res.json({
      periodo: {
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
      },
      performance: resultado,
    });
  } catch (error) {
    console.error("Erro ao gerar relatório de performance:", error);
    res.status(500).json({ error: "Erro ao gerar relatório de performance" });
  }
};

// Relatório de Impressão por Loja
export const relatorioImpressao = async (req, res) => {
  try {
    const { lojaId, dataInicio, dataFim } = req.query;

    if (!lojaId) {
      return res.status(400).json({ error: "lojaId é obrigatório" });
    }

    if (!dataInicio || !dataFim) {
      return res
        .status(400)
        .json({ error: "dataInicio e dataFim são obrigatórios" });
    }

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999); // Incluir todo o dia final

    // Buscar informações da loja
    const loja = await Loja.findByPk(lojaId);
    if (!loja) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }

    // Buscar informações da empresa
    const { Empresa } = await import("../models/index.js");
    const empresa = await Empresa.findByPk(req.empresaId);

    // Buscar todas as movimentações da loja no período
    const movimentacoes = await Movimentacao.findAll({
      where: {
        empresaId: req.empresaId,
        dataColeta: {
          [Op.between]: [inicio, fim],
        },
      },
      include: [
        {
          model: Maquina,
          as: "maquina",
          where: { lojaId: lojaId },
          attributes: ["id", "codigo", "nome"],
        },
        {
          model: MovimentacaoProduto,
          as: "detalhesProdutos",
          include: [
            {
              model: Produto,
              as: "produto",
              attributes: ["id", "nome", "codigo", "emoji"],
            },
          ],
        },
      ],
      order: [["dataColeta", "DESC"]],
    });

    // Calcular totais
    const totalFichas = movimentacoes.reduce(
      (sum, m) => sum + (m.fichas || 0),
      0,
    );
    const totalSairam = movimentacoes.reduce(
      (sum, m) => sum + (m.sairam || 0),
      0,
    );
    const totalAbastecidas = movimentacoes.reduce(
      (sum, m) => sum + (m.abastecidas || 0),
      0,
    );
    const totalDinheiro = movimentacoes.reduce(
      (sum, m) => sum + parseFloat(m.quantidade_notas_entrada || 0),
      0,
    );
    const totalPix = movimentacoes.reduce(
      (sum, m) => sum + parseFloat(m.valor_entrada_maquininha_pix || 0),
      0,
    );

    // Consolidar produtos que saíram
    const produtosSairamMap = {};
    movimentacoes.forEach((mov) => {
      mov.detalhesProdutos?.forEach((mp) => {
        if (mp.quantidadeSaiu > 0) {
          const key = mp.produtoId;
          if (!produtosSairamMap[key]) {
            produtosSairamMap[key] = {
              produto: mp.produto,
              quantidade: 0,
            };
          }
          produtosSairamMap[key].quantidade += mp.quantidadeSaiu;
        }
      });
    });

    // Consolidar produtos que entraram (abastecidos)
    const produtosEntraramMap = {};
    movimentacoes.forEach((mov) => {
      mov.detalhesProdutos?.forEach((mp) => {
        if (mp.quantidadeAbastecida > 0) {
          const key = mp.produtoId;
          if (!produtosEntraramMap[key]) {
            produtosEntraramMap[key] = {
              produto: mp.produto,
              quantidade: 0,
            };
          }
          produtosEntraramMap[key].quantidade += mp.quantidadeAbastecida;
        }
      });
    });

    const produtosSairam = Object.values(produtosSairamMap).sort(
      (a, b) => b.quantidade - a.quantidade,
    );

    const produtosEntraram = Object.values(produtosEntraramMap).sort(
      (a, b) => b.quantidade - a.quantidade,
    );

    // Consolidar dados por máquina
    const dadosPorMaquina = {};
    movimentacoes.forEach((mov) => {
      const maquinaId = mov.maquina.id;
      if (!dadosPorMaquina[maquinaId]) {
        dadosPorMaquina[maquinaId] = {
          maquina: {
            id: mov.maquina.id,
            codigo: mov.maquina.codigo,
            nome: mov.maquina.nome,
          },
          fichas: 0,
          totalSairam: 0,
          totalAbastecidas: 0,
          numMovimentacoes: 0,
          produtosSairam: {},
          produtosEntraram: {},
        };
      }

      dadosPorMaquina[maquinaId].fichas += mov.fichas || 0;
      dadosPorMaquina[maquinaId].totalSairam += mov.sairam || 0;
      dadosPorMaquina[maquinaId].totalAbastecidas += mov.abastecidas || 0;
      dadosPorMaquina[maquinaId].numMovimentacoes++;

      // Produtos por máquina
      mov.detalhesProdutos?.forEach((mp) => {
        if (mp.quantidadeSaiu > 0) {
          const key = mp.produtoId;
          if (!dadosPorMaquina[maquinaId].produtosSairam[key]) {
            dadosPorMaquina[maquinaId].produtosSairam[key] = {
              produto: mp.produto,
              quantidade: 0,
            };
          }
          dadosPorMaquina[maquinaId].produtosSairam[key].quantidade +=
            mp.quantidadeSaiu;
        }

        if (mp.quantidadeAbastecida > 0) {
          const key = mp.produtoId;
          if (!dadosPorMaquina[maquinaId].produtosEntraram[key]) {
            dadosPorMaquina[maquinaId].produtosEntraram[key] = {
              produto: mp.produto,
              quantidade: 0,
            };
          }
          dadosPorMaquina[maquinaId].produtosEntraram[key].quantidade +=
            mp.quantidadeAbastecida;
        }
      });
    });

    // Formatar dados por máquina
    const maquinasDetalhadas = Object.values(dadosPorMaquina).map((m) => ({
      maquina: m.maquina,
      totais: {
        fichas: m.fichas,
        produtosSairam: m.totalSairam,
        produtosEntraram: m.totalAbastecidas,
        movimentacoes: m.numMovimentacoes,
      },
      produtosSairam: Object.values(m.produtosSairam)
        .map((p) => ({
          id: p.produto.id,
          nome: p.produto.nome,
          codigo: p.produto.codigo,
          emoji: p.produto.emoji,
          quantidade: p.quantidade,
        }))
        .sort((a, b) => b.quantidade - a.quantidade),
      produtosEntraram: Object.values(m.produtosEntraram)
        .map((p) => ({
          id: p.produto.id,
          nome: p.produto.nome,
          codigo: p.produto.codigo,
          emoji: p.produto.emoji,
          quantidade: p.quantidade,
        }))
        .sort((a, b) => b.quantidade - a.quantidade),
    }));

    res.json({
      // ...existing code...
      loja: {
        id: loja.id,
        nome: loja.nome,
        endereco: loja.endereco,
      },
      periodo: {
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
      },
      totais: {
        fichas: totalFichas,
        dinheiro: totalDinheiro,
        pix: totalPix,
        produtosSairam: totalSairam,
        produtosEntraram: totalAbastecidas,
        movimentacoes: movimentacoes.length,
      },
      produtosSairam: produtosSairam.map((p) => ({
        id: p.produto.id,
        nome: p.produto.nome,
        codigo: p.produto.codigo,
        emoji: p.produto.emoji,
        quantidade: p.quantidade,
      })),
      produtosEntraram: produtosEntraram.map((p) => ({
        id: p.produto.id,
        nome: p.produto.nome,
        codigo: p.produto.codigo,
        emoji: p.produto.emoji,
        quantidade: p.quantidade,
      })),
      maquinas: maquinasDetalhadas,
      empresaConfig: empresa?.configuracoes || {},
    });
  } catch (error) {
    console.error("Erro ao gerar relatório de impressão:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      error: "Erro ao gerar relatório de impressão",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
