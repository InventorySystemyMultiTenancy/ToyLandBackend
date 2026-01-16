// MIGRATION: Adiciona externalId, email e dataExpiracao à tabela empresas
"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("empresas", "externalId", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
      comment: "ID do cliente no gateway de pagamento (Asaas, Stripe, etc)",
    });
    await queryInterface.addColumn("empresas", "email", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: false,
      comment: "Email do cliente para integração com gateway",
    });
    await queryInterface.addColumn("empresas", "dataExpiracao", {
      type: Sequelize.DATE,
      allowNull: true,
      comment: "Data de expiração do plano (renovada via webhook)",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("empresas", "externalId");
    await queryInterface.removeColumn("empresas", "email");
    await queryInterface.removeColumn("empresas", "dataExpiracao");
  },
};
