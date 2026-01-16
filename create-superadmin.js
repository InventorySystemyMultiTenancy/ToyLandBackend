import dotenv from "dotenv";
import { sequelize } from "./src/database/connection.js";
import { Usuario } from "./src/models/index.js";

dotenv.config();

const createSuperAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado ao banco de dados");

    const email = "superadmin@agarramais.com";
    const senha = "SuperAdmin@123";

    // Verifica se já existe
    const existente = await Usuario.findOne({ where: { email } });

    if (existente) {
      console.log("⚠️  SUPER_ADMIN já existe:", email);
      console.log("Role atual:", existente.role);

      // Atualiza para SUPER_ADMIN se não for
      if (existente.role !== "SUPER_ADMIN") {
        existente.role = "SUPER_ADMIN";
        await existente.save();
        console.log("✅ Role atualizado para SUPER_ADMIN");
      }
    } else {
      // Cria novo
      await Usuario.create({
        nome: "Super Administrador",
        email,
        senha, // O model vai fazer o hash automaticamente
        role: "SUPER_ADMIN",
        telefone: "(11) 99999-9999",
        ativo: true,
      });
      console.log("✅ SUPER_ADMIN criado com sucesso!");
      console.log("Email:", email);
      console.log("Senha:", senha);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
};

createSuperAdmin();
