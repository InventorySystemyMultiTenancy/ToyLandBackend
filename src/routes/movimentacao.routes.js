import express from "express";
import { listarProblemasInconsistencia } from "../controllers/movimentacaoController.js";
import {
  registrarMovimentacao,
  listarMovimentacoes,
  obterMovimentacao,
  atualizarMovimentacao,
  deletarMovimentacao,
} from "../controllers/movimentacaoController.js";
import {
  autenticar,
  autorizarRole,
  registrarLog,
  verificarPermissaoLoja,
} from "../middlewares/auth.js";

const router = express.Router();
// Corrigido: rota deve ser registrada após router ser inicializado
router.get(
  "/problemas-inconsistencia",
  autenticar,
  listarProblemasInconsistencia,
);

router.get("/", autenticar, listarMovimentacoes);
router.get("/:id", autenticar, verificarPermissaoLoja(), obterMovimentacao);
router.post(
  "/",
  autenticar,
  verificarPermissaoLoja("registrarMovimentacao"),
  registrarLog("REGISTRAR_MOVIMENTACAO", "Movimentacao"),
  registrarMovimentacao,
);
router.put(
  "/:id",
  autenticar,
  verificarPermissaoLoja("editar"),
  registrarLog("EDITAR_MOVIMENTACAO", "Movimentacao"),
  atualizarMovimentacao,
);
router.delete(
  "/:id",
  autenticar,
  verificarPermissaoLoja("editar"),
  autorizarRole("ADMIN"),
  registrarLog("DELETAR_MOVIMENTACAO", "Movimentacao"),
  deletarMovimentacao,
);

export default router;
