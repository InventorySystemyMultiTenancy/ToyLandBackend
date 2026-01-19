// seed-custom.js
// Script para popular o banco com uma empresa, lojas e produtos de exemplo

const { Empresa, Loja, Produto, Usuario } = require("./models");
const db = require("./database/connection");

async function seedCustom() {
  try {
    await db.sync();

    // Empresa exemplo genérica
    const empresa = await Empresa.create({
      nome: "Empresa Exemplo",
      cnpj: "00.000.000/0001-00",
      email: "contato@empresaexemplo.com",
      telefone: "(00) 0000-0000",
      // Adicione outros campos necessários
    });

    // Lojas exemplo genéricas
    const lojas = await Promise.all([
      Loja.create({
        nome: "Loja Exemplo 1",
        empresaId: empresa.id,
        endereco: "Endereço Exemplo 1",
      }),
      Loja.create({
        nome: "Loja Exemplo 2",
        empresaId: empresa.id,
        endereco: "Endereço Exemplo 2",
      }),
    ]);

    // Produtos exemplo genéricos
    const produtos = await Promise.all([
      Produto.create({
        nome: "Produto Exemplo 1",
        preco: 10.0,
        empresaId: empresa.id,
      }),
      Produto.create({
        nome: "Produto Exemplo 2",
        preco: 20.0,
        empresaId: empresa.id,
      }),
      Produto.create({
        nome: "Produto Exemplo 3",
        preco: 30.0,
        empresaId: empresa.id,
      }),
    ]);

    // Usuário exemplo genérico (admin da empresa)
    await Usuario.create({
      nome: "Admin Exemplo",
      email: "admin@empresaexemplo.com",
      senha: "123456", // Idealmente, gere hash
      empresaId: empresa.id,
      tipo: "admin",
    });

    console.log("Seed customizado executado com sucesso!");
    process.exit(0);
  } catch (err) {
    console.error("Erro ao executar seed customizado:", err);
    process.exit(1);
  }
}

seedCustom();
