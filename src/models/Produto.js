import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

const Produto = sequelize.define(
  "Produto",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    codigo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      // unique removido, agora índice composto
      comment: "Código do produto para identificação",
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    categoria: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Ex: Pelúcia, Boneco, Chaveiro",
    },
    tamanho: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "Ex: Pequeno, Médio, Grande",
    },
    emoji: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: "Emoji visual do produto",
    },
    preco: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      comment: "Preço de venda",
    },
    custoUnitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      comment: "Custo do produto",
      field: "custounitario",
    },
    estoqueAtual: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: "Estoque atual disponível",
      field: "estoqueatual",
    },
    estoqueMinimo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: "Estoque mínimo para alertas",
      field: "estoqueminimo",
    },
    imagemUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "imagemurl",
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    empresaId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "empresas",
        key: "id",
      },
      field: "empresaid",
    },
  },
  {
    tableName: "produtos",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["codigo", "empresaId"],
      },
      {
        fields: ["empresaId"],
      },
    ],
  },
);

export default Produto;
