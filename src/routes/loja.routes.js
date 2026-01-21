import express from "express";
import {
  listarLojas,
  obterLoja,
  criarLoja,
  atualizarLoja,
  deletarLoja,
} from "../controllers/lojaController.js";
import {
  autenticar,
  autorizarRole,
  registrarLog,
  verificarPermissaoLoja,
} from "../middlewares/auth.js";

const router = express.Router();

router.get("/", autenticar, verificarPermissaoLoja(), listarLojas);
router.get("/:id", autenticar, verificarPermissaoLoja(), obterLoja);
router.post(
  "/",
  autenticar,
  autorizarRole("ADMIN"),
  verificarPermissaoLoja("editar"),
  registrarLog("CRIAR_LOJA", "Loja"),
  criarLoja,
);
router.put(
  "/:id",
  autenticar,
  autorizarRole("ADMIN"),
  verificarPermissaoLoja("editar"),
  registrarLog("EDITAR_LOJA", "Loja"),
  atualizarLoja,
);
router.delete(
  "/:id",
  autenticar,
  autorizarRole("ADMIN"),
  verificarPermissaoLoja("editar"),
  registrarLog("DELETAR_LOJA", "Loja"),
  deletarLoja,
);

export default router;
