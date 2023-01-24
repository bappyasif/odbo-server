const express = require("express");
const { authenticatedUserJwtVerification } = require("../controllers/auth");
const { getAllPosts, getSoloPost, createNewPost, updateSoloPost, deleteSoloPost, updateSoloPostWithUserEngagements, getAllPostsWithPublicPrivacy, updateSoloPostWithSpecificData, getAllSpecificActionTypesPosts, getAllPrivatePostsFromFriends } = require("../controllers/post");
const postRoutes = express();

postRoutes.get("/", getAllPostsWithPublicPrivacy)
// postRoutes.get("/:userId/friends/posts/private", getAllPrivatePostsFromFriends)
postRoutes.get("/:userId/friends/posts/private", authenticatedUserJwtVerification, getAllPrivatePostsFromFriends)

// postRoutes.get("/:userId", getAllPosts)
postRoutes.get("/:userId", authenticatedUserJwtVerification, getAllPosts)
postRoutes.get("/:userId/specific/:type", getAllSpecificActionTypesPosts)

postRoutes.get("/solo/:postId", getSoloPost);

// postRoutes.post("/post/create/:userId", createNewPost);
postRoutes.post("/post/create/:userId", authenticatedUserJwtVerification, createNewPost);

// postRoutes.put("/:postId", updateSoloPost);
// postRoutes.put("/:postId/:interactingUserId", updateSoloPostWithUserEngagements);
postRoutes.put("/:postId", authenticatedUserJwtVerification, updateSoloPost); // chances are its not used by client side, just to be cautious placed a gate keeping
postRoutes.put("/:postId/:interactingUserId", authenticatedUserJwtVerification, updateSoloPostWithUserEngagements);

// postRoutes.delete("/:postId", deleteSoloPost);
postRoutes.delete("/:postId", authenticatedUserJwtVerification, deleteSoloPost);

// postRoutes.put("/update/shared/:postId", updateSoloPostWithSpecificData);
postRoutes.put("/update/shared/:postId", authenticatedUserJwtVerification, updateSoloPostWithSpecificData);

module.exports = postRoutes;