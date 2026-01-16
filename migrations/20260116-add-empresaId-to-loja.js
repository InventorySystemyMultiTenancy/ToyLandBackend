"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("lojas", "empresaId", {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "empresas",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("lojas", "empresaId");
  },
};
