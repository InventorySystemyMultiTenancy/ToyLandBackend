import express from "express";
import { buscarPorSubdominio } from "../controllers/empresaController.js";

const router = express.Router();

// Endpoint para buscar empresa pelo subdomínio
router.get("/subdomain/:subdomain", buscarPorSubdominio);

export default router;
