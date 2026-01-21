import express from "express";
import {
  listarMovimentacoesEstoqueLoja,
  criarMovimentacaoEstoqueLoja,
  editarMovimentacaoEstoqueLoja,
  deletarMovimentacaoEstoqueLoja,
} from "../controllers/movimentacaoEstoqueLojaController.js";
import { autenticar, verificarPermissaoLoja } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", autenticar, listarMovimentacoesEstoqueLoja);
router.post(
  "/",
  autenticar,
  verificarPermissaoLoja("registrarMovimentacao"),
  criarMovimentacaoEstoqueLoja,
);
router.put(
  "/:id",
  autenticar,
  verificarPermissaoLoja("editar"),
  editarMovimentacaoEstoqueLoja,
);
router.delete(
  "/:id",
  autenticar,
  verificarPermissaoLoja("editar"),
  deletarMovimentacaoEstoqueLoja,
);

export default router;
