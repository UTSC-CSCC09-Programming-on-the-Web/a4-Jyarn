import { User } from "../models/users.js";
import { Router } from "express";
import { Token } from "../models/tokens.js";
import { Image } from "../models/images.js";
import { validateNumber, validateString } from "../utils/validateInput.js";

import { Op, QueryTypes } from "sequelize";

import { sequelize } from "../datasource.js";
import { createToken } from "../utils/validateUser.js";
import bcrypt from "bcrypt";

export const usersRouter = Router();

usersRouter.post("/signup", async (req, res) => {
  if (!validateString(req.body.username))
    return res.status(422).json({ error: "Invalid or missing username." });
  else if (!validateString(req.body.password))
    return res.status(422).json({ error: "Missing password name." });

  const user = User.build({
    username: req.body.username,
  });

  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  user.password = bcrypt.hashSync(req.body.password, salt);

  try {
    await user.save();
    const token = await createToken(user.id);
    return res.json({
      username: user.username,
      token: token,
    });
  } catch {
    return res.status(422).json({ error: "User creation failed." });
  }
});

usersRouter.post("/signin", async (req, res) => {
  if (!validateString(req.body.username))
    return res.status(401).json({ error: "Invalid or missing author name." });
  else if (!validateString(req.body.password))
    return res.status(401).json({ error: "Invalid or missing password." });

  const user = await User.findOne({
    where: {
      username: req.body.username,
    },
  });

  if (user === null) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }
  // password incorrect
  if (!bcrypt.compareSync(req.body.password, user.password)) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }

  let token;
  if (user.TokenId === null) token = await createToken(user.id);
  else {
    await Token.destroy({
      where: { id: user.TokenId },
    });
    token = await createToken(user.id);
  }

  return res.status(200).json({ userId: user.id, token });
});

usersRouter.delete("/signout", async (req, res) => {
  const succ = await Token.destroy({
    where: { token: req.token },
  });

  if (succ === 1) return res.status(200).json({ message: "Success." });
  return res.status(500).json({ error: "An unexpected error has occured." });
});

usersRouter.get("/me", async (req, res) => {
  // me
  const user = await User.findByPk(req.userId, {
    attributes: ["id"],
  });
  return res.status(200).json(user);
});

usersRouter.get("/:userId/images", async (req, res) => {
  if (!validateNumber(req.query.cursor))
    return res.status(400).json({ error: "Invalid cursor." });
  else if (!validateString(req.query.action))
    return res.status(400).json({ error: "Invalid action passed." });
  if (!validateNumber(req.params.userId))
    return res.status(400).json({ error: "Invalid User Id." });

  let cursor = parseInt(req.query.cursor);
  if (cursor === -1) cursor = Number.MAX_SAFE_INTEGER;

  let where;
  let order;
  switch (req.query.action) {
    case "prev":
      where = { id: { [Op.gt]: cursor } };
      order = [["createdAt", "ASC"]];
      break;
    case "next":
      where = { id: { [Op.lt]: cursor } };
      order = [["createdAt", "DESC"]];
      break;
    default:
      return res.status(400).json({ error: "Invalid action passed." });
  }

  where.UserId = req.params.userId;

  const images = await Image.findAll({
    where,
    order,
    attributes: ["id", "title", ["createdAt", "date"]],
    include: { association: "User", attributes: [["username", "author"]] },
    limit: 1,
  });

  const count = await Image.count({
    where: { UserId: req.params.userId },
  });

  if (images.length === 0)
    return res.status(200).json({
      image: null,
      next_cursor: parseInt(req.query.cursor),
      count,
    });
  return res.status(200).json({
    image: images[0],
    next_cursor: images[0].id,
    count,
  });
});

usersRouter.get("/", async (req, res) => {
  const users = await sequelize.query(
    `
    SELECT Thumbnails.id AS imageId, Users.id AS userId, Users.username
    FROM Users
    LEFT JOIN (SELECT * FROM Images GROUP BY Images.UserId HAVING MIN(createdAt)) AS Thumbnails
    ON Users.id = Thumbnails.UserId
  `,
    {
      type: QueryTypes.SELECT,
    },
  );

  return res.status(200).json({ users });
});
