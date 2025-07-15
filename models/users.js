import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { Token } from "./tokens.js";

export const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

User.hasOne(Token, {
  onDelete: "CASCADE",
});

Token.hasOne(User, {
  onDelete: "SET NULL",
});
