import { sequelize } from "./src/database/connection.js";

async function checkMaquinaEmpresa() {
  try {
    // Buscar a máquina Maq01Loja01
    const [maquinas] = await sequelize.query(`
      SELECT m.id, m.nome, m.codigo, m.empresaid, e.nome as empresa_nome, e.subdomain
      FROM maquinas m
      LEFT JOIN empresas e ON m.empresaid = e.id
      WHERE m.nome LIKE '%Maq01%' OR m.codigo LIKE '%Maq01%'
      ORDER BY m.nome
    `);

    console.log("\n=== MÁQUINAS ENCONTRADAS ===");
    console.log(JSON.stringify(maquinas, null, 2));

    // Buscar empresa EmpresaExemplo
    const [empresas] = await sequelize.query(`
      SELECT id, nome, subdomain
      FROM empresas
      WHERE subdomain = 'empresaexemplo'
    `);

    console.log("\n=== EMPRESA EXEMPLO ===");
    console.log(JSON.stringify(empresas, null, 2));

    // Buscar todas empresas
    const [todasEmpresas] = await sequelize.query(`
      SELECT id, nome, subdomain, 
        (SELECT COUNT(*) FROM maquinas WHERE empresaid = empresas.id) as total_maquinas
      FROM empresas
      ORDER BY nome
    `);

    console.log("\n=== TODAS AS EMPRESAS ===");
    console.log(JSON.stringify(todasEmpresas, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Erro:", error);
    process.exit(1);
  }
}

checkMaquinaEmpresa();
