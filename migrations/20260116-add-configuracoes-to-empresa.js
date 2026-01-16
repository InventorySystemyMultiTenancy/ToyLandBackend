"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("empresas", "configuracoes", {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
      comment:
        "Preferências como logoUrl, corPrimaria, textoRodapeRelatorio, fusoHorario",
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("empresas", "configuracoes");
  },
};
