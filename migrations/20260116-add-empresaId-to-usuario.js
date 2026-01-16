"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("usuarios", "empresaId", {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "empresas",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
    await queryInterface
      .removeConstraint("usuarios", "usuarios_email_key")
      .catch(() => {});
    await queryInterface.addIndex("usuarios", ["email", "empresaId"], {
      unique: true,
      name: "usuarios_email_empresaId_unique",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex(
      "usuarios",
      "usuarios_email_empresaId_unique"
    );
    await queryInterface.removeColumn("usuarios", "empresaId");
    await queryInterface.addConstraint("usuarios", {
      fields: ["email"],
      type: "unique",
      name: "usuarios_email_key",
    });
  },
};
