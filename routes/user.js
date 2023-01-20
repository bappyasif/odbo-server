const express = require("express");
const { authenticatedUserJwtVerification } = require("../controllers/auth");
const { getAllUsers, getAnUser, updateUser, deleteUser, acceptUserFriendRequest, rejectUserFriendRequest, removeUserFromFriendList, updateUserProfileInfo, getAnUserWithMinimumData } = require("../controllers/user");
const { isAuthenticated } = require("./auth");
const userRoutes = express();

userRoutes.get("/", isAuthenticated, getAllUsers)
userRoutes.get("/:userId/publicPayload", getAnUserWithMinimumData);
// userRoutes.get("/:userId", isAuthenticated, getAnUser)
userRoutes.get("/:userId", authenticatedUserJwtVerification, getAnUser)

userRoutes.put("/:userId/profile", isAuthenticated, updateUserProfileInfo)
userRoutes.put("/:userId", isAuthenticated, updateUser)
userRoutes.delete("/:userId", isAuthenticated, deleteUser)

userRoutes.put("/:userId/accept", acceptUserFriendRequest)
userRoutes.put("/:userId/reject", rejectUserFriendRequest)

userRoutes.put("/:userId/remove", isAuthenticated, removeUserFromFriendList)

module.exports = userRoutes;