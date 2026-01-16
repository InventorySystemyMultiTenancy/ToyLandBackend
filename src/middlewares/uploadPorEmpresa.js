import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const empresaId = req.empresaId;
    // Exemplo: tipo pode ser "produtos", "relatorios", etc
    const tipo = req.uploadTipo || "produtos";
    const dir = path.join("uploads", empresaId, tipo);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

export const uploadPorEmpresa = multer({ storage });
