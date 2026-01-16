import superadminRoutes from "./superadmin.routes.js";
// Rotas exclusivas do SUPER_ADMIN
router.use("/superadmin", superadminRoutes);
const router = express.Router();

router.use("/auth", authRoutes);
router.use("/usuarios", usuarioRoutes);
router.use("/lojas", lojaRoutes);
router.use("/maquinas", maquinaRoutes);
router.use("/produtos", produtoRoutes);
router.use("/movimentacoes", movimentacaoRoutes);
router.use("/relatorios", relatorioRoutes);
router.use("/admin", adminRoutes);
router.use("/estoque-lojas", estoqueLojaRoutes);
router.use("/movimentacao-estoque-loja", movimentacaoEstoqueLojaRoutes);

export default router;
