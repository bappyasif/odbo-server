const express = require("express");
const { getAllUsers, getAnUser, updateUser, deleteUser, acceptUserFriendRequest, rejectUserFriendRequest, removeUserFromFriendList, updateUserProfileInfo } = require("../controllers/user");
const userRoutes = express();

userRoutes.get("/", getAllUsers)
userRoutes.get("/:userId", getAnUser)

userRoutes.put("/:userId/profile", updateUserProfileInfo)
userRoutes.put("/:userId", updateUser)
userRoutes.delete("/:userId", deleteUser)

userRoutes.put("/:userId/accept", acceptUserFriendRequest)
userRoutes.put("/:userId/reject", rejectUserFriendRequest)

userRoutes.put("/:userId/remove", removeUserFromFriendList)

module.exports = userRoutes;