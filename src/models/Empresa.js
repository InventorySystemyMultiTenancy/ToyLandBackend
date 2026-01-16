import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

const Empresa = sequelize.define(
  "Empresa",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cnpj: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    externalId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      comment: "ID do cliente no gateway de pagamento (Asaas, Stripe, etc)",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: false,
      comment: "Email do cliente para integração com gateway",
    },
    dataExpiracao: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Data de expiração do plano (renovada via webhook)",
    },
    plano: {
      type: DataTypes.ENUM("BASIC", "PRO"),
      allowNull: false,
      defaultValue: "BASIC",
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    configuracoes: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment:
        "Preferências como logoUrl, corPrimaria, textoRodapeRelatorio, fusoHorario",
    },
  },
  {
    tableName: "empresas",
    timestamps: true,
  }
);

Empresa.associate = (models) => {
  Empresa.hasMany(models.Usuario, { foreignKey: "empresaId" });
};

export default Empresa;
