import express from "express";
import {
  listarProdutos,
  obterProduto,
  criarProduto,
  atualizarProduto,
  deletarProduto,
  listarCategorias,
} from "../controllers/produtoController.js";
  autenticar,
  autorizarRole,
  registrarLog,
  verificarPermissaoLoja,
} from "../middlewares/auth.js";

const router = express.Router();

router.get("/", autenticar, verificarPermissaoLoja(), listarProdutos);
router.get("/categorias", autenticar, verificarPermissaoLoja(), listarCategorias);
router.get("/:id", autenticar, verificarPermissaoLoja(), obterProduto);
router.post(
  "/",
  autenticar,
  autorizarRole("ADMIN"),
  verificarPermissaoLoja("editar"),
  registrarLog("CRIAR_PRODUTO", "Produto"),
  criarProduto
);
router.put(
  "/:id",
  autenticar,
  autorizarRole("ADMIN"),
  verificarPermissaoLoja("editar"),
  registrarLog("EDITAR_PRODUTO", "Produto"),
  atualizarProduto
);
router.delete(
  "/:id",
  autenticar,
  autorizarRole("ADMIN"),
  verificarPermissaoLoja("editar"),
  registrarLog("DELETAR_PRODUTO", "Produto"),
  deletarProduto
);

export default router;
