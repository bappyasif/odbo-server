const express = require("express");
const { getAllComments, getSoloComment, deleteSoloComment, updateSoloCommentCounts, createNewComment, getAllCommentsFromSinglePost, updateSoloCommentText } = require("../controllers/comment");
const commentRoutes = express();

commentRoutes.get("/", getAllComments);

commentRoutes.get("/:commentId", getSoloComment);
commentRoutes.delete("/:commentId", deleteSoloComment);
commentRoutes.put("/:commentId", updateSoloCommentCounts);
commentRoutes.put("/:commentId/text", updateSoloCommentText);

commentRoutes.post("/create/new", createNewComment);

commentRoutes.get("/post/:postId", getAllCommentsFromSinglePost);

module.exports = commentRoutes