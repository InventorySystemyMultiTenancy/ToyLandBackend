import jwt from "jsonwebtoken";
import { Usuario } from "../models/index.js";
import LogAtividade from "../models/LogAtividade.js";

// Middleware para proteger rotas de super admin (gestão SaaS)
export const verificarSuperAdmin = (req, res, next) => {
  // Verifica se o usuário tem role SUPER_ADMIN
  if (req.usuario && req.usuario.role === "SUPER_ADMIN") {
    return next();
  }
  return res.status(403).json({ error: "Acesso restrito ao super admin." });
};

// US01 - Middleware de Autenticação
export const autenticar = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Carrega o usuário básico primeiro
    let usuario = await Usuario.findByPk(decoded.id);

    if (!usuario || !usuario.ativo) {
      return res
        .status(401)
        .json({ error: "Usuário não encontrado ou inativo" });
    }

    // SUPER_ADMIN não precisa carregar empresa
    if (usuario.role === "SUPER_ADMIN") {
      console.log(
        `✅ SUPER_ADMIN autenticado: ${usuario.email} - Rota: ${req.method} ${req.originalUrl}`,
      );
      req.usuario = usuario;
      req.empresaId = "000001"; // SUPER_ADMIN tem empresaId global
      return next();
    }

    // Para outros usuários, carrega a empresa
    usuario = await Usuario.findByPk(decoded.id, {
      include: [{ association: "empresa", required: true }],
    });

    // Verifica se a empresa está ativa
    if (!usuario.empresa || usuario.empresa.ativo === false) {
      return res
        .status(403)
        .json({ error: "Empresa inativa ou não encontrada" });
    }

    console.log(
      `[AUTH] Usuário autenticado: ${usuario.email} | EmpresaId: ${usuario.empresaId} | Empresa: ${usuario.empresa?.nome}`,
    );

    req.usuario = usuario;
    req.empresaId = usuario.empresaId;
    next();
  } catch (error) {
    console.error("Erro no middleware de autenticação:", error);
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
};

// US02 - Middleware de Autorização por Role
export const autorizarRole = (...rolesPermitidas) => {
  return (req, res, next) => {
    console.log(
      `🔐 Verificando autorização - Rota: ${req.method} ${req.originalUrl}`,
    );
    console.log(`   Role do usuário: ${req.usuario?.role}`);
    console.log(`   Roles permitidas: ${rolesPermitidas.join(", ")}`);

    // SUPER_ADMIN tem acesso total
    if (req.usuario?.role === "SUPER_ADMIN") {
      console.log("✅ SUPER_ADMIN: acesso total concedido");
      return next();
    }

    if (!rolesPermitidas.includes(req.usuario.role)) {
      console.log(
        `❌ Acesso negado - Role ${req.usuario.role} não está em [${rolesPermitidas.join(", ")}]`,
      );
      return res.status(403).json({
        error: "Acesso negado. Você não tem permissão para esta ação.",
      });
    }

    console.log(`✅ Acesso autorizado`);
    next();
  };
};

// US02 - Middleware de Verificação de Permissão em Loja
export const verificarPermissaoLoja = (acao = "visualizar") => {
  return async (req, res, next) => {
    try {
      // Admin tem acesso total
      if (req.usuario.role === "ADMIN") {
        return next();
      }

      const lojaId = req.params.lojaId || req.body.lojaId;

      if (!lojaId) {
        return res.status(400).json({ error: "ID da loja não fornecido" });
      }

      const { UsuarioLoja } = await import("../models/index.js");
      const permissao = await UsuarioLoja.findOne({
        where: {
          usuarioId: req.usuario.id,
          lojaId: lojaId,
        },
      });

      if (!permissao) {
        return res.status(403).json({
          error: "Você não tem permissão para acessar esta loja",
        });
      }

      // Verificar permissão específica
      if (acao === "editar" && !permissao.permissoes.editar) {
        return res.status(403).json({
          error: "Você não tem permissão para editar nesta loja",
        });
      }

      if (
        acao === "registrarMovimentacao" &&
        !permissao.permissoes.registrarMovimentacao
      ) {
        return res.status(403).json({
          error:
            "Você não tem permissão para registrar movimentações nesta loja",
        });
      }

      next();
    } catch (error) {
      console.error("Erro ao verificar permissão:", error);
      return res.status(500).json({ error: "Erro ao verificar permissões" });
    }
  };
};

// US03 - Middleware de Log de Atividades
export const registrarLog = (acao, entidade = null) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
      res.send = originalSend;

      // Só registra log em caso de sucesso (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        LogAtividade.create({
          usuarioId: req.usuario?.id,
          acao,
          entidade,
          entidadeId: req.params.id || res.locals.entityId,
          detalhes: {
            method: req.method,
            path: req.path,
            body: req.method !== "GET" ? req.body : undefined,
            params: req.params,
            query: req.query,
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get("user-agent"),
        }).catch((err) => console.error("Erro ao criar log:", err));
      }

      return res.send(data);
    };

    next();
  };
};

// Alias para verificar se é ADMIN (convenção)
export const verificarAdmin = autorizarRole("ADMIN");
