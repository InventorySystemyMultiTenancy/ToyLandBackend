import { sequelize } from "./src/database/connection.js";
import { v4 as uuidv4 } from "uuid";

async function runMultiTenantMigration() {
  const empresaId = uuidv4();
  const transaction = await sequelize.transaction();
  try {
    // 1. Criar tabela empresas
    await sequelize.query(
      `
      CREATE TABLE IF NOT EXISTS empresas (
        id UUID PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cnpj VARCHAR(50) UNIQUE,
        plano VARCHAR(20) NOT NULL DEFAULT 'BASIC',
        ativo BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `,
      { transaction }
    );

    // 2. Inserir Empresa Padrão
    await sequelize.query(
      `INSERT INTO empresas (id, nome, cnpj, plano, ativo, "createdAt", "updatedAt") VALUES
        (:id, 'Minha Empresa Matriz', '00000000000000', 'BASIC', TRUE, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;`,
      { replacements: { id: empresaId }, transaction }
    );

    // 3. Adicionar empresaId nas tabelas
    const tabelas = [
      "usuarios",
      "lojas",
      "produtos",
      "maquinas",
      "movimentacoes",
    ];
    for (const tabela of tabelas) {
      await sequelize.query(
        `ALTER TABLE ${tabela} ADD COLUMN IF NOT EXISTS "empresaId" UUID;`,
        { transaction }
      );
      await sequelize.query(
        `UPDATE ${tabela} SET "empresaId" = :empresaId WHERE "empresaId" IS NULL;`,
        { replacements: { empresaId }, transaction }
      );
    }

    // 4. Alterar empresaId para NOT NULL e adicionar Foreign Key
    for (const tabela of tabelas) {
      await sequelize.query(
        `ALTER TABLE ${tabela} ALTER COLUMN "empresaId" SET NOT NULL;`,
        { transaction }
      );
      await sequelize.query(
        `DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name = '${tabela}' AND constraint_type = 'FOREIGN KEY' AND constraint_name = '${tabela}_empresaId_fkey'
          ) THEN
            ALTER TABLE ${tabela} ADD CONSTRAINT ${tabela}_empresaId_fkey FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT;
          END IF;
        END $$;`,
        { transaction }
      );
    }

    await transaction.commit();
    console.log("✅ Migração multi-tenant concluída com sucesso!");
    console.log("Empresa padrão criada com id:", empresaId);
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Erro na migração multi-tenant:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMultiTenantMigration();
