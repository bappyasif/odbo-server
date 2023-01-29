const { body, validationResult } = require("express-validator");
const async = require("async");
const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");

const getAllUsers = (req, res, next) => {
    User.find({})
        .then(results => {
            res.status(200).json({ success: true, data: results })
        }).catch(err => next(err))
}

const getAnUserWithMinimumData = (req, res, next) => {
    User.findById({ _id: req.params.userId })
        .then(result => {
            const payload = {
                ppUrl: result?.ppUrl || "https://random.imagecdn.app/500/150",
                fullName: result?.fullName,
                created: result?.created,
                _id: result?._id
            }
            res.status(200).json({ success: true, data: payload })
        }).catch(err => next(err))
}

const getAnUser = (req, res, next) => {
    User.findById({ _id: req.params.userId })
        .then(result => {
            res.status(200).json({ success: true, data: result })
        }).catch(err => next(err))
}

const updateUserProfileInfo = (req, res, next) => {
    let userId = req.params.userId;
    let data = req.body;

    // console.log(data, userId, "wat wat!!")

    User.findOne({ _id: userId })
        .then(currentUser => {
            if (data.ppUrl) {
                currentUser.ppUrl = data.ppUrl;
            }

            if (data.cpUrl) {
                currentUser.cpUrl = data.cpUrl;
            }

            if (data.topics) {
                currentUser.topics = data.topics;
            }

            if (data.fullName) {
                currentUser.fullName = data.fullName;
            }

            if (data.bio) {
                currentUser.bio = data.bio;
            }

            // console.log(currentUser, "currentuser!!")

            User.findByIdAndUpdate(currentUser._id, currentUser, {})
                .then(() => {
                    console.log("user profile data updated....");
                    res.status(200).json({ success: true, user: currentUser })
                })
                .catch(err => next(err))

        }).catch(err => next(err))
}

const updateUser = (req, res, next) => {
    User.findOne({ _id: req.params.userId })
        .then(currentUser => {
            if (currentUser) {
                let dynamicKey = Object.keys(req.body)[0]
                let dynamicValue = Object.values(req.body)[0]

                // checking if friends related values are already exists or not
                // if so then we'll remove it, representing Undo action from client "connect" routes

                let chkExists = currentUser[dynamicKey].includes(dynamicValue)

                if (Object.keys(req.body)[0] !== "topics") {
                    if (chkExists) {
                        let filtered = currentUser[dynamicKey].filter(val => val !== dynamicValue)
                        currentUser[dynamicKey] = filtered;
                    } else {
                        currentUser[dynamicKey].push(dynamicValue)
                    }
                } else {
                    currentUser.topics = req.body.topics;
                }

                // now updating with new user data
                User.findByIdAndUpdate(currentUser._id, currentUser, {})
                    .then(() => res.status(200).json({ success: true, user: currentUser }))
                    .catch(err => next(err));
            }
        }).catch(err => next(err));
}

const deleteUser = (req, res, next) => {
    const userId = req.params.userId
    async.parallel(
        {
            deleteUserCreatedPosts(cb) {
                Post.deleteMany({userId: userId}).exec(cb)
            },
            deleteUserCreatedComments(cb) {
                Comment.deleteMany({userId: userId}).exec(cb)
            }
        },
        (err, results) => {
            if(err) return next(err)

            console.log("DELETED POSTS AND COMMENTS FROM THIS USER")

            User.findByIdAndDelete({ _id: userId })
                .then(err => {
                    if (err) return next(err);
                    res.status(200).json({ success: true, msg: "user has been deleted" })
                }).catch(err => next(err))
        }
    )
}

// const deleteUser = (req, res, next) => {
//     User.findByIdAndDelete({ _id: req.params.userId })
//         .then(err => {
//             if (err) return next(err);           
//             res.status(200).json({ success: true, msg: "user has been deleted" })
//         }).catch(err => next(err))
// }

const acceptUserFriendRequest = (req, res, next) => {
    let friendId = req.body.accept
    let userId = req.params.userId
    User.findOne({ _id: userId })
        .then(currentUser => {
            if (currentUser) {
                let filter = currentUser.frRecieved.filter(id => id !== friendId)

                currentUser.frRecieved = filter;

                currentUser.friends.push(friendId)

                User.findOne({ _id: friendId })
                    .then(friendUser => {
                        if (friendUser) {
                            let filter = friendUser.frSent.filter(id => id !== userId)
                            friendUser.frSent = filter;
                            friendUser.friends.push(userId);

                            User.findByIdAndUpdate(friendUser._id, friendUser, {})
                                .then(() => console.log("inside friend user update call successfull from accept"))
                                .catch(err => next(err))
                        }
                    })

                User.findByIdAndUpdate(currentUser._id, currentUser, {})
                    .then(() => res.status(200).json({ success: true, user: currentUser }))
                    .catch(err => next(err));
            }
        }).catch(err => next(err));
}

const rejectUserFriendRequest = (req, res, next) => {
    let friendId = req.body.reject
    let userId = req.params.userId
    User.findOne({ _id: userId })
        .then(currentUser => {
            if (currentUser) {
                let filter = currentUser.frRecieved.filter(id => id !== friendId)
                currentUser.frRecieved = filter;

                User.findOne({ _id: friendId })
                    .then(friendUser => {
                        if (friendUser) {
                            let filter = friendUser.frSent.filter(id => id !== userId)
                            friendUser.frSent = filter;

                            User.findByIdAndUpdate(friendUser._id, friendUser, {})
                                .then(() => console.log("inside friend user update call successfull from reject"))
                                .catch(err => next(err))
                        }
                    })

                User.findByIdAndUpdate(currentUser._id, currentUser, {})
                    .then(() => res.status(200).json({ success: true, user: currentUser }))
                    .catch(err => next(err));
            }
        }).catch(err => next(err));
}

let removeUserFromFriendList = (req, res, next) => {
    let friendId = req.body.friendId
    let userId = req.params.userId;

    async.parallel(
        {
            currentUser(cb) {
                User.findOne({ _id: userId }).exec(cb)
            },
            friendUser(cb) {
                User.findOne({ _id: friendId }).exec(cb)
            }
        },
        (err, results) => {
            if (err) return next(err);

            let filterCurrentUserFriendsArray = results.currentUser.friends.filter(val => val !== friendId);
            results.currentUser.friends = filterCurrentUserFriendsArray;

            let filterFriendUserFriendsArray = results.friendUser.friends.filter(val => val !== userId)
            results.friendUser.friends = filterFriendUserFriendsArray;

            // console.log(results.currentUser.friends, "filteredFriendsArray", results.friendUser.friends)

            User.findByIdAndUpdate(userId, results.currentUser, {})
                .then(() => console.log("current user friends list is updated"))
                .catch(err => next(err))

            User.findByIdAndUpdate(friendId, results.friendUser, {})
                .then(() => console.log("friend user friends list is updated"))
                .catch(err => next(err))

            res.status(200).json({ success: true, data: [] })
        }
    )
}

module.exports = {
    updateUserProfileInfo,
    removeUserFromFriendList,
    acceptUserFriendRequest,
    rejectUserFriendRequest,
    getAllUsers,
    getAnUser,
    updateUser,
    deleteUser,
    getAnUserWithMinimumData
}