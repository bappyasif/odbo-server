const express = require("express");
const { getAllPosts, getSoloPost, createNewPost, updateSoloPost, deleteSoloPost, updateSoloPostWithUserEngagements, getAllPostsWithPublicPrivacy, updateSoloPostWithSpecificData, getAllSpecificActionTypesPosts, getAllPrivatePostsFromFriends } = require("../controllers/post");
const postRoutes = express();

postRoutes.get("/", getAllPostsWithPublicPrivacy)
postRoutes.get("/:userId/friends/posts/private", getAllPrivatePostsFromFriends)

postRoutes.get("/:userId", getAllPosts)
postRoutes.get("/:userId/specific/:type", getAllSpecificActionTypesPosts)

postRoutes.get("/solo/:postId", getSoloPost);

postRoutes.post("/post/create/:userId", createNewPost);

postRoutes.put("/:postId", updateSoloPost);
postRoutes.put("/:postId/:interactingUserId", updateSoloPostWithUserEngagements);

postRoutes.delete("/:postId", deleteSoloPost);

postRoutes.put("/update/shared/:postId", updateSoloPostWithSpecificData);

module.exports = postRoutes;