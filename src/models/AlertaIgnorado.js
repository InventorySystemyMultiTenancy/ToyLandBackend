import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

const AlertaIgnorado = sequelize.define(
  "AlertaIgnorado",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    maquinaId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "maquinaid",
      references: {
        model: "maquinas",
        key: "id",
      },
    },
    alertaId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "alertaid",
    },
    usuarioId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "usuarioid",
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    dataIgnorado: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "dataignorado",
    },
  },
  {
    tableName: "alertas_ignorados",
    timestamps: true,
  },
);

export default AlertaIgnorado;
