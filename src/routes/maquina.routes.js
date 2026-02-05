import express from "express";
import {
  listarMaquinas,
  obterMaquina,
  criarMaquina,
  atualizarMaquina,
  deletarMaquina,
  obterEstoqueAtual,
} from "../controllers/maquinaController.js";
import {
  autenticar,
  autorizarRole,
  registrarLog,
  verificarPermissaoLoja,
} from "../middlewares/auth.js";
import { problemaMaquina } from "../controllers/movimentacaoController.js";

const router = express.Router();

router.get("/", autenticar, listarMaquinas);
router.get("/:id", autenticar, verificarPermissaoLoja(), obterMaquina);
router.get(
  "/:id/estoque",
  autenticar,
  verificarPermissaoLoja(),
  obterEstoqueAtual,
);
router.get(
  "/:id/problema",
  autenticar,
  verificarPermissaoLoja(),
  problemaMaquina,
);
router.post(
  "/",
  autenticar,
  autorizarRole("ADMIN", "CONFIGURADOR_MAQUINA"),
  verificarPermissaoLoja("editar"),
  registrarLog("CRIAR_MAQUINA", "Maquina"),
  criarMaquina,
);
router.put(
  "/:id",
  autenticar,
  autorizarRole("ADMIN"),
  verificarPermissaoLoja("editar"),
  registrarLog("EDITAR_MAQUINA", "Maquina"),
  atualizarMaquina,
);
router.delete(
  "/:id",
  autenticar,
  autorizarRole("ADMIN"),
  verificarPermissaoLoja("editar"),
  registrarLog("DELETAR_MAQUINA", "Maquina"),
  deletarMaquina,
);

export default router;
