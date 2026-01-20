import { sequelize } from "./src/database/connection.js";
import Usuario from "./src/models/Usuario.js";

async function resetAdminPassword() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado ao banco de dados");

    const email = process.argv[2];
    const novaSenha = process.argv[3];

    if (!email || !novaSenha) {
      console.log(
        "\n❌ Uso: node reset-admin-password.js <email> <nova-senha>\n",
      );
      console.log(
        "Exemplo: node reset-admin-password.js admin@empresa.com senha123\n",
      );
      process.exit(1);
    }

    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      console.log(`\n❌ Usuário com email ${email} não encontrado\n`);
      process.exit(1);
    }

    console.log(`\n📋 Usuário encontrado:`);
    console.log(`   ID: ${usuario.id}`);
    console.log(`   Nome: ${usuario.nome}`);
    console.log(`   Email: ${usuario.email}`);
    console.log(`   Role: ${usuario.role}`);
    console.log(`   Ativo: ${usuario.ativo}`);

    // Atualizar senha (o hook beforeUpdate vai hashear automaticamente)
    usuario.senha = novaSenha;
    await usuario.save();

    console.log(`\n✅ Senha atualizada com sucesso!`);
    console.log(`   Nova senha: ${novaSenha}`);
    console.log(`   Hash gerado: ${usuario.senha.substring(0, 20)}...\n`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Erro ao resetar senha:", error.message);
    process.exit(1);
  }
}

resetAdminPassword();
