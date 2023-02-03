const { body, validationResult } = require("express-validator");
const async = require("async");
const moment = require("moment");
const otpGenerator = require("otp-generator");
const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");
const Otp = require("../models/otp");
const { generatePassword } = require("../utils/jwt");
const { etherialEmailClientAgent } = require("../utils/nodeMailer");

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

const resetPasswordWithOtp = [
    body("otpCode").exists().isNumeric().escape().isLength({ min: 6, max: 6 }),
    body("email", "email is not valid").exists().isEmail().normalizeEmail(),
    body("password", "password is not valid").exists().isLength({ min: 4 }),
    body("confirm", "confirm password is invalid").exists().isLength({ min: 4 }),
    body("confirm", "confirm password doesn't match with password").custom((val, { req }) => val === req.body.password),
    (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(401).json({ msg: "user input validation failed", erros: errors.array() })
        }

        // lookup user in db
        User.findOne({ email: req.body.email })
            .then(foundUser => {
                if (foundUser) {
                    // generating hash and salt for user login process with this new password
                    const getSaltAndHash = generatePassword(req.body.password);
                    const salt = getSaltAndHash.salt;
                    const hash = getSaltAndHash.hash;

                    foundUser.hash = hash;
                    foundUser.salt = salt;
                    foundUser.password = req.body.password;

                    // now update this in db store
                    User.findByIdAndUpdate(foundUser._id, foundUser, {})
                        .then(() => {
                            // if (err) return res.status(401).json({ msg: "user update has caused an error!!" })
                            // now deleting otp from db store as well
                            Otp.findOne({ otp: req.body.otpCode })
                                .then((result => {
                                    if(!result) return res.status(401).json({ msg: "otp has not been found in store!!" })

                                    if(!result?.verified) {
                                        return res.status(401).json({ msg: "otp has not been verified yet!!" })
                                    }

                                    Otp.findByIdAndDelete(result?._id)
                                        .then((foundOtp) => {
                                            // console.log("otp is now deleted from db!!")
                                            // return res.status(200).json({ msg: "user account password is now set. redirect them to login page" })
                                            if(foundOtp) {
                                                // if(!foundOtp?.verified) {
                                                //     return res.status(401).json({ msg: "otp has not been verified yet!!" })
                                                // }
                                                console.log("otp is now deleted from db!!")
                                            return res.status(200).json({ msg: "user account password is now set. redirect them to login page" })
                                            } else {
                                                return res.status(401).json({ msg: "user provided otp is not found in store!!" })
                                            }
                                        }).catch(err => console.log("otp deletion has failed after password reset", err))

                                })).catch(err => {
                                    console.log("otp look up failed!!", err)
                                    res.status(401).json({ msg: "otp look up failed!!" })
                                })

                        }).catch(err => {
                            console.log("user update has failed!!", err);
                            return res.status(401).json({ msg: "user update has failed!!" })
                        })
                } else {
                    return res.status(401).json({ msg: "user is not found!!" })
                }
            })
    }
]

const verifyOtp = [
    body("otpCode").exists().isNumeric().escape().isLength({ min: 6, max: 6 }),
    (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(401).json({ msg: "user input validation failed", erros: errors.array() })
        }

        const otpCode = req.body.otpCode;
        // check if token exists in body
        if (otpCode) {
            // check if code exists in db
            Otp.findOne({ otp: otpCode })
                .then(result => {
                    if (result) {
                        // check otpCode is not verified already
                        if (result.verified) {
                            // as otp is already verified and another requests coming with same id in verification process means its unwanted or malicious, so removing it altogether from store
                            Otp.findByIdAndDelete(result._id)
                                .then(() => {
                                    return res.status(403).json({ msg: "Otp code is already verified" })
                                }).catch(err => console.log("otp deletion has failed after verify", err))
                        } else {
                            // check if otpCode is not over expiration date
                            if (moment(Date.now()).isBefore(result.expDate)) {
                                console.log("otp is still vaild")
                                // lets update its verified value so that if its been used from any other requests it shall be nullified
                                result.verified = true;

                                Otp.findByIdAndUpdate(result._id, result, {})
                                    .then(updated => {
                                        return res.status(200).json({ msg: "otp verified!!", otpCode: updated.otp })
                                    }).catch(err => console.log("otp update has failed after verify", err))
                            } else {
                                console.log("otp expired")
                                // as expired theres no point in keeping this on store, so lets remove this as well
                                Otp.findByIdAndDelete(result._id)
                                    .then(() => {
                                        console.log("otp deleted from store")
                                    }).catch(err => console.log("otp deletion has failed after expired", err))
                                    .finally(() => {
                                        return res.status(401).json({ msg: "Otp code has expired" })
                                    })
                            }
                        }
                    } else {
                        return res.status(401).json({ msg: "Otp code is missing in store" })
                    }
                }).catch(err => {
                    console.log("otp fetch has failed!!", err)
                    return res.status(501).json({ msg: "error occured" })
                })
        } else {
            return res.status(401).json({ msg: "Otp code is missing in request" })
        }
    }
]

const sendOtpViaEmail = (req, res) => {
    const toAddress = req.body.email;
    User.findOne({ email: toAddress })
        .then(currentUser => {
            if (currentUser) {
                // generate otp
                const otpPass = otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false })
                const timeNow = new Date();
                const otpExpiration = new Date(timeNow.getTime() + 15 * 60000); // adding 15 mins to current time for otp expiration time limit

                etherialEmailClientAgent(toAddress, otpPass)
                    .then((info) => {
                        console.log("message sent", info?.messageId)
                        if (info?.messageId) {
                            // creating otp instance up in db
                            const otpInstance = new Otp({
                                otp: otpPass,
                                expDate: otpExpiration,
                                verified: false
                            });

                            otpInstance.save((err, result) => {
                                if (err) return res.status(400).json({ msg: "otp instance saved failed" })

                                // sucessfully saved
                                console.log("otp saved", result)
                                // sending response back to client about email being successfully sent to address
                                res.status(200).json({ msg: "email sent", msgId: info?.messageId })
                            })
                        }

                    }).catch(err => console.log("email couldnt be sent", err))
            } else {
                console.log("email is not found!!")
                return res.status(401).json({ msg: "email provided is unrecognised" })
            }
        }).catch(err => {
            console.log("email fetch has failed!!", err)
            return res.status(401).json({ msg: "email fetch has failed!!" })
        })
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

const resetUserAccountPassword = [
    body("current-password", "can not be empty").isLength({ min: 1 }).escape(),
    // body("current-password", "current password doesnt match with account stored password")
    // .custom((val, {req}) => {
    //     const userId = req.params.userId;
    //     console.log(userId, val)
    //     return User.findOne({_id: userId})
    //     .then(currentUser => {
    //         console.log(userId, val, currentUser.password, currentUser.password === val)
    //         if(currentUser.password === val) {
    //             console.log("password matched!!")
    //             // return true
    //             return Promise.resolve("password matched!!")
    //         } else {
    //             console.log("password mismatched!!")
    //             // return false
    //             return Promise.reject("password mismatched!!")
    //         }
    //     }).catch(err => console.log("db method error occured"))
    // }),
    body("new-password", "can not be empty").isLength({ min: 1 }).escape(),
    body("confirm-password", "can not be empty").isLength({ min: 1 }).escape(),
    body("confirm-password", "new password confirmation does not match")
        .custom((val, { req }) => {
            // console.log(val === req.body["new-password"], val, req.body["new-password"])
            return val === req.body["new-password"]
        }),
    (req, res) => {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            console.log("errors!!", errors.array())
            return res.status(401).json({ msg: "error occured", errors: errors.array() })
        }

        const userId = req.params.userId;

        return User.findOne({ _id: userId })
            .then(currentUser => {
                // console.log(userId, val, currentUser.password, currentUser.password === val)
                console.log(currentUser.password === req.body["current-password"], currentUser.password, req.body["current-password"])
                if (currentUser.password === req.body["current-password"]) {

                    console.log("password matched!!", req.body["new-password"])

                    const getSaltAndHash = generatePassword(req.body["new-password"]);

                    const salt = getSaltAndHash.salt;
                    const hash = getSaltAndHash.hash;

                    currentUser.password = req.body["new-password"]
                    currentUser.salt = salt;
                    currentUser.hash = hash;

                    User.findByIdAndUpdate(currentUser._id, currentUser, {})
                        .then(() => {
                            res.status(200).json({ msg: "password changed!!" })
                        }).catch(err => console.log(err, "updated failed!!"))

                    // console.log("all good!!", req.body)
                    // res.status(200).json({ msg: "password changed!!" })
                    // return true
                    // return Promise.resolve("password matched!!")
                } else {
                    console.log("password mismatched!!")
                    res.status(403).json({ msg: "user current password mismatched!!" })
                    // return false
                    // return Promise.reject("password mismatched!!")
                }
            }).catch(err => console.log("db method error occured"))
    }
]

const deleteUser = (req, res, next) => {
    const userId = req.params.userId
    async.parallel(
        {
            deleteUserCreatedPosts(cb) {
                Post.deleteMany({ userId: userId }).exec(cb)
            },
            deleteUserCreatedComments(cb) {
                Comment.deleteMany({ userId: userId }).exec(cb)
            }
        },
        (err, results) => {
            if (err) return next(err)

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
    getAnUserWithMinimumData,
    resetUserAccountPassword,
    sendOtpViaEmail,
    verifyOtp,
    resetPasswordWithOtp
}