import { Router } from "express";
import { Image } from "../models/images.js";
import { Comment } from "../models/comments.js";
import multer from "multer";
import path from "path";
import { validateString, validateNumber } from "../utils/validateInput.js";

export const imagesRouter = Router();
const upload = multer({ dest: "uploads/" });

const allowedFiles = ["image/png", "image/jpeg", "image/gif", "image/webp"];

imagesRouter.post("/", upload.single("picture"), async (req, res) => {
  try {
    if (!validateString(req.body.title))
      return res.status(400).json({ error: "Invalid image title." });
    else if (
      req.file === undefined ||
      !allowedFiles.includes(req.file.mimetype)
    )
      return res
        .status(400)
        .json({ error: "Missing image or invalid image type." });

    const image = await Image.create({
      title: req.body.title,
      picture: req.file,
      UserId: req.userId,
    });

    return res.json({
      imageId: image.id,
    });
  } catch {
    return res.status(422).json({ error: "Failed to post image" });
  }
});

imagesRouter.get("/:id/image", async (req, res) => {
  if (!validateNumber(req.params.id))
    return res.status(400).json({ error: "Invalid image id." });

  const image = await Image.findByPk(req.params.id);
  if (!image)
    return res
      .status(404)
      .json({ error: `Unable to find image with id = ${req.params.id}` });

  res.setHeader("Content-Type", image.picture.mimetype);
  res.sendFile(image.picture.path, { root: path.resolve() });
});

imagesRouter.delete("/:id", async (req, res) => {
  if (!validateNumber(req.params.id))
    return res.status(400).json({ error: "Invalid image id." });

  const image = await Image.findByPk(req.params.id);

  if (!image)
    return res
      .status(404)
      .json({ error: `Unable to find image with id = ${req.params.id}` });
  else if (image.UserId !== req.userId)
    return res.status(403).json({ error: `Forbidden.` });

  image.destroy();
  return res.status(200).json({
    message: `Successfully deleted image with id = ${req.params.id}`,
  });
});

imagesRouter.post(`/:imageId/comments/`, async (req, res) => {
  try {
    if (!validateString(req.body.content))
      return res
        .status(400)
        .json({ error: "Invalid or missing content string." });
    else if (!validateNumber(req.params.imageId))
      return res.status(400).json({ error: "Invalid image id." });

    const comment = await Comment.create({
      content: req.body.content,
      ImageId: req.params.imageId,
      UserId: req.userId,
    });

    return res.status(200).json({ commentId: comment.id });
  } catch {
    return res.status(422).json({ error: "Failed to post comment." });
  }
});

imagesRouter.get(`/:imageId/comments/`, async (req, res) => {
  if (!validateNumber(req.query.page))
    return res.status(400).json({ error: "Invalid page." });
  else if (!validateNumber(req.params.imageId))
    return res.status(400).json({ error: "Invalid image id." });

  const page = Math.max(parseInt(req.query.page), 0);

  const { count, rows } = await Comment.findAndCountAll({
    where: { ImageId: req.params.imageId },
    offset: page * 10,
    limit: 10,
    order: [["createdAt", "DESC"]],
    attributes: ["content", ["createdAt", "date"], "id", ["UserId", "userId"]],
    include: { association: "User", attributes: [["username", "author"]] },
  });

  return res.status(200).json({
    comments: rows.length === 0 ? null : rows,
    count,
  });
});
