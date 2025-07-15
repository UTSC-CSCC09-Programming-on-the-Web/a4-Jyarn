import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { Image } from "./images.js";
import { User } from "./users.js";

export const Comment = sequelize.define("Comment", {
  content: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

Comment.belongsTo(Image, {
  onDelete: "CASCADE",
});

Image.hasMany(Comment);

Comment.belongsTo(User, {
  onDelete: "CASCADE",
});

User.hasMany(Comment);
