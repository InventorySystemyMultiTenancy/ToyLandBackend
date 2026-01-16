"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Índices simples em empresaId
    await queryInterface.addIndex("usuarios", ["empresaId"]);
    await queryInterface.addIndex("lojas", ["empresaId"]);
    await queryInterface.addIndex("produtos", ["empresaId"]);
    await queryInterface.addIndex("maquinas", ["empresaId"]);
    await queryInterface.addIndex("movimentacoes", ["empresaId"]);
    // Índice composto para buscas frequentes por empresaId + dataColeta
    await queryInterface.addIndex("movimentacoes", ["empresaId", "dataColeta"]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex("usuarios", ["empresaId"]);
    await queryInterface.removeIndex("lojas", ["empresaId"]);
    await queryInterface.removeIndex("produtos", ["empresaId"]);
    await queryInterface.removeIndex("maquinas", ["empresaId"]);
    await queryInterface.removeIndex("movimentacoes", ["empresaId"]);
    await queryInterface.removeIndex("movimentacoes", [
      "empresaId",
      "dataColeta",
    ]);
  },
};
