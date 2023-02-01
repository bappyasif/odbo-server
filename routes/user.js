const express = require("express");
const { authenticatedUserJwtVerification } = require("../controllers/auth");
const { getAllUsers, getAnUser, updateUser, deleteUser, acceptUserFriendRequest, rejectUserFriendRequest, removeUserFromFriendList, updateUserProfileInfo, getAnUserWithMinimumData, resetUserAccountPassword, sendOtpViaEmail } = require("../controllers/user");
const { isAuthenticated } = require("./auth");
const userRoutes = express();

// userRoutes.get("/", isAuthenticated, getAllUsers)
userRoutes.get("/", authenticatedUserJwtVerification, getAllUsers)
userRoutes.get("/:userId/publicPayload", getAnUserWithMinimumData);
// userRoutes.get("/:userId", isAuthenticated, getAnUser)
userRoutes.get("/:userId", authenticatedUserJwtVerification, getAnUser)

// userRoutes.put("/:userId/profile", isAuthenticated, updateUserProfileInfo)
// userRoutes.put("/:userId", isAuthenticated, updateUser)
// userRoutes.delete("/:userId", isAuthenticated, deleteUser)
userRoutes.put("/:userId/profile", authenticatedUserJwtVerification, updateUserProfileInfo)
userRoutes.put("/:userId", authenticatedUserJwtVerification, updateUser)
userRoutes.delete("/:userId", authenticatedUserJwtVerification, deleteUser)
userRoutes.put("/:userId/reset-password", authenticatedUserJwtVerification, resetUserAccountPassword)

// userRoutes.put("/:userId/accept", acceptUserFriendRequest)
// userRoutes.put("/:userId/reject", rejectUserFriendRequest)
userRoutes.put("/:userId/accept", authenticatedUserJwtVerification, acceptUserFriendRequest)
userRoutes.put("/:userId/reject", authenticatedUserJwtVerification, rejectUserFriendRequest)

// userRoutes.put("/:userId/remove", isAuthenticated, removeUserFromFriendList)
userRoutes.put("/:userId/remove", authenticatedUserJwtVerification, removeUserFromFriendList)

userRoutes.post("/send-otp-code", sendOtpViaEmail)

module.exports = userRoutes;