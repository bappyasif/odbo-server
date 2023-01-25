const express = require("express");
const { authenticatedUserJwtVerification } = require("../controllers/auth");
const { getAllComments, getSoloComment, deleteSoloComment, updateSoloCommentCounts, createNewComment, getAllCommentsFromSinglePost, updateSoloCommentText } = require("../controllers/comment");
const commentRoutes = express();

commentRoutes.get("/", authenticatedUserJwtVerification, getAllComments);

commentRoutes.get("/:commentId", getSoloComment);
// commentRoutes.delete("/:commentId", deleteSoloComment);
commentRoutes.delete("/:commentId", authenticatedUserJwtVerification, deleteSoloComment);

// commentRoutes.put("/:commentId", updateSoloCommentCounts);
commentRoutes.put("/:commentId", authenticatedUserJwtVerification, updateSoloCommentCounts);

commentRoutes.put("/:commentId/text", authenticatedUserJwtVerification, updateSoloCommentText);

commentRoutes.post("/create/new", authenticatedUserJwtVerification, createNewComment);

commentRoutes.get("/post/:postId", getAllCommentsFromSinglePost);

module.exports = commentRoutes