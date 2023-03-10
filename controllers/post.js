const { body, validationResult, check } = require("express-validator");
const createDomPurify = require("dompurify");
const { JSDOM } = require("jsdom");
const async = require("async");
const Post = require("../models/post");
const User = require("../models/user");
const { sanitizeContent } = require("./comment");

const getAllPosts = (req, res, next) => {
    let userId = req.params.userId;

    Post.find({ userId: userId })
        .then(results => {
            res.status(200).json({ success: true, data: results })
        }).catch(err => next(err))
}

const getCurrentUserCreatedPrivatePosts = (req, res) => {
    const userId = req.params.userId;
    // private posts by this current user
    Post.find({ userId: userId, privacy: "Friends" })
        .then(results => {
            if (results.length) {
                res.status(200).json({ success: true, msg: "current user created all private posts", privatePosts: results })
            }
        }).catch(err => {
            console.log("current user private posts fetch failed", err);
            res.status(402).json({ success: false, msg: "private posts fetching failed!!" })
        })
}

const getAllPrivatePostsFromFriends = (req, res, next) => {
    let userId = req.params.userId;

    let foundPosts = [];

    User.findOne({ _id: userId })
        .then((dataset) => {
            // private posts from this current user friends
            if (dataset.friends.length) {
                let allPromises = dataset.friends.map(val => {
                    return Post.find({ userId: val, privacy: "Friends" })
                })

                Promise.all(allPromises).then(results => {
                    results.forEach(item => item.length && foundPosts.push(...item))
                }).catch(err => next(err))
                    .then(() => {
                        // console.log(foundPosts, "inside - II")
                        res.status(200).json({ status: "success", data: foundPosts })
                    })
            }
        }).catch(err => next(err))
}

getAllSpecificActionTypesPosts = (req, res, next) => {
    let userId = req.params.userId;
    let data = req.body;
    let postType = req.params.type;

    Post.find({ userId: userId })
        .then(results => {
            let filteredPosts = [];

            results.forEach(item => {
                item.usersEngagged.forEach(vals => {
                    if (Object.keys(vals)[0] === userId) {
                        Object.values(vals)[0][postType] ? filteredPosts.push(item) : null
                    }
                })

            })

            // console.log(filteredPosts, "filtered posts!!")
            res.status(200).json({ success: true, data: filteredPosts })
        }).catch(err => next(err))
}

const getAllPostsWithPublicPrivacy = (req, res, next) => {
    async.parallel(
        {
            emptyPrivacy(cb) {
                Post.find({ privacy: "" }).exec(cb)
            },

            everybodyPrivacy(cb) {
                Post.find({ privacy: "Everybody" }).exec(cb)
            }
        },

        (err, results) => {
            if (err) return res.status(403).json({ success: false, msg: "error occured while getting all posts from server" });
            res.status(200).json({ success: true, data: [...results.emptyPrivacy, ...results.everybodyPrivacy] })
        }
    )
}

const getSoloPost = (req, res, next) => {
    Post.findById({ _id: req.params.postId })
        .then(result => {
            res.status(200).json({ success: true, data: result })
        }).catch(err => next(err))
}

const createNewPost = [
    body("body", "post can not be left empty")
        .trim().isLength({ min: 1 }),
    body("body", "post needs to be at least 4 characters long")
        .trim().isLength({ min: 4 }),
    // body("body", "no dirty or fishy or sketchy tags are allowed")
    //     .custom(val => {
    //         const window = new JSDOM("").window;
    //         const DomPurify = createDomPurify(window);
    //         const clean = DomPurify.sanitize(val)
    //         return clean
    //     }),
    body("Image", "image url needs to be a proper url")
        .isURL().optional(),
    // .trim().escape(),
    body("Video", "video url needs to be a proper url")
        .isURL().optional(),
    // .trim().escape(),
    // body("Gif", "gif needs to be an array of gif object")
    //     .isObject().optional(),
    body("Gif", "gif needs to be a string containing it's id")
        .isString().optional(),
    check("Poll", "poll needs to be an array of object")
        .isObject().optional(),
    body("Privacy", "Privacy needs to be a string")
        .trim().isString().escape(),

    (req, res, next) => {
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(402).json({ success: false, errors: errors.array() })
        }

        // const sanitizeBodyHtmlContent = (val) => {
        //     const window = new JSDOM("").window;
        //     const DomPurify = createDomPurify(window);
        //     const clean = DomPurify.sanitize(val)
        //     return clean
        // }

        // data is sanitized and validated for to be saved in databse
        let newPost = new Post({
            // body: req.body.body,
            // body: sanitizeBodyHtmlContent(req.body.body),
            body: sanitizeContent(req.body.body),
            userId: req.params.userId,
            created: new Date().toISOString(),
            privacy: req.body.Privacy,
            imageUrl: req.body.Image,
            videoUrl: req.body.Video,
            poll: req.body.Poll,
            gif: req.body.Gif
        })

        newPost.save((err, post) => {
            if (err) return next(err)

            // save successfull, so lets response bvack to user about this
            console.log("post saved!!")
            res.status(200).json({ success: true, post: post })
        })
    }
]

const updateSoloPost = [
    body("Like").isInt().exists(),
    body("Dislike").isInt().exists(),
    body("Love").isInt().exists(),
    body("Share").isInt().exists(),
    (req, res, next) => {
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            console.log("updatew solo error list", errors.array())
            return res.status(402).json({ success: false, errors: errors.array() })
        }

        let data = req.body;

        Post.findOne({ _id: req.params.postId })
            .then(currentPost => {
                // updating post with data sent to server from client
                currentPost.likesCount = data.Like,
                    currentPost.dislikesCount = data.Dislike,
                    currentPost.loveCount = data.Love,
                    currentPost.shareCount = data.Share

                // updating post with latest post data
                Post.findByIdAndUpdate(currentPost._id, currentPost, {})
                    .then((currPost) => {
                        console.log("data updated solo post!!")
                        res.status(200).json({ success: true, posts: [] })
                    })
                    .catch(err => next(err))
            }).catch(err => next(err))
    }
]

const updateSoloPostWithSpecificData = [
    body("propKey").exists().trim(),
    body("propValue").exists().trim(),
    (req, res, next) => {
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            console.log("update solo post with specific data error list", errors.array())
            return res.status(402).json({ success: false, errors: errors.array() })
        }

        let dataBody = req.body;
        let postId = req.params.postId;
        // console.log(dataBody, "dataBody!!", postId)
        Post.findOne({ _id: postId })
            .then(currentPost => {
                currentPost[dataBody.propKey] = dataBody.propValue
                Post.findByIdAndUpdate(currentPost._id, currentPost, {})
                    .then(updatedPost => {
                        return res.status(200).json({ success: true, posts: [], updatedPost: updatedPost })
                    }).catch(err => next(err))
            }).catch(err => next(err))
    }
]

const updateSoloPostWithUserEngagements = [
    body("Like").isInt().exists(),
    body("Dislike").isInt().exists(),
    body("Love").isInt().exists(),
    body("Share").isInt().exists(),
    body("Comment").isInt().exists(),
    (req, res, next) => {
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            console.log("update solo with engagement error list", errors.array())
            return res.status(402).json({ success: false, errors: errors.array() })
        }

        let data = req.body;
        // console.log(data, "!!", req.params.postId, req.params.interactingUserId, data.currentUserCounts)

        Post.findOne({ _id: req.params.postId })
            .then(currentPost => {
                // updating post with data sent to server from client

                currentPost.likesCount = data.Like;

                currentPost.dislikesCount = data.Dislike;

                currentPost.loveCount = data.Love

                currentPost.shareCount = data.Share

                currentPost.commentsCount = data.Comment

                let findIdx = currentPost.usersEngagged?.findIndex(item => Object.keys(item)[0] === req.params.interactingUserId)

                if (findIdx === -1) {
                    // console.log("check notfound!!")
                    currentPost.usersEngagged.push({ [req.params.interactingUserId]: data.currentUserCounts })
                } else {
                    // console.log("check found!!")
                    currentPost.usersEngagged[findIdx] = { [req.params.interactingUserId]: data.currentUserCounts }
                }

                // updating post with latest post data
                Post.findByIdAndUpdate(currentPost._id, currentPost, {})
                    .then((currPost) => {
                        console.log("data updated solo post user enegagements!!")
                        res.status(200).json({ success: true, posts: [], currPost: currPost })
                    })
                    .catch(err => next(err))
            }).catch(err => next(err))
    }
]

const deleteSoloPost = (req, res, next) => {
    Post.find({ includedSharedPostId: req.params.postId }).
        then(foundPosts => {
            // console.log("outside posts!!")
            foundPosts.forEach(post => {
                // console.log("inside post!!")
                post.includedSharedPostId = "post deleted"
                Post.findByIdAndUpdate(post._id, post, {})
                    .then(() => console.log("includedSharedPostID updated"))
                    .catch(err => res.status(402).json({ success: false, msg: "shared post update failed while deleting!!" }))
                Post.findByIdAndDelete({ _id: req.params.postId })
                    .then(() => {
                        // console.log("post is now deleted", includedSharedPostId);
                        return res.status(200).json({ success: true, data: "post is now deleted" })
                    })
                    .catch(err => res.status(402).json({ success: false, msg: "delete failed!!" }))
            })
        })
    // when solo post is getting deleted
    Post.findByIdAndDelete({ _id: req.params.postId })
        .then(() => {
            // console.log("post is now deleted", includedSharedPostId);
            return res.status(200).json({ success: true, data: "post is now deleted" })
        })
        .catch(err => res.status(402).json({ success: false, msg: "delete failed!!" }))
    // res.status(200).json({ success: true, data: "post is now deleted" })
}

// const deleteSoloPost = (req, res, next) => {
//     Post.findByIdAndDelete({ _id: req.params.postId })
//         .then(() => {
//             console.log("post is now deleted", includedSharedPostId);
//             res.status(200).json({ success: true, data: "post is now deleted" })
//         })
//         .catch(err => next(err))
// }

module.exports = {
    getAllPosts,
    getSoloPost,
    createNewPost,
    updateSoloPost,
    deleteSoloPost,
    updateSoloPostWithUserEngagements,
    getAllPostsWithPublicPrivacy,
    updateSoloPostWithSpecificData,
    getAllSpecificActionTypesPosts,
    getAllPrivatePostsFromFriends,
    getCurrentUserCreatedPrivatePosts
}