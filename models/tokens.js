import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";

// We want to be able to identify the user from their token. So we need to
// define a separate table
export const Token = sequelize.define("Token", {
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  expires: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});
