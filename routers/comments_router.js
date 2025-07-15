import { Router } from "express";
import { Comment } from "../models/comments.js";
import { validateNumber } from "../utils/validateInput.js";

export const commentsRouter = Router();

commentsRouter.delete("/:commentId", async (req, res) => {
  if (!validateNumber(req.params.commentId))
    return res.status(400).json({ error: "Invalid comment id." });

  const comment = await Comment.findOne({
    include: {
      association: "Image",
    },
    where: {
      id: req.params.commentId,
    },
  });

  if (comment === null)
    return res.status(404).json({
      error: `Unable to find comment with id = ${req.params.commentId}`,
    });
  else if (comment.Image.UserId !== req.userId && comment.UserId !== req.userId)
    return res.status(403).json({
      error: "Forbidden.",
    });
  else comment.destroy();

  return res.status(200).json({
    message: `Successfully deleted comment with id = ${req.params.commentId}`,
  });
});
