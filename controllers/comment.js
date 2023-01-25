const { body, validationResult } = require("express-validator");
const Comment = require("../models/comment");

const getAllComments = (req, res, next) => {
    Comment.find({})
        .then(results => {
            res.status(200).json({ success: true, data: results })
        }).catch(err => next(err))
}

const getSoloComment = (req, res, next) => {
    Comment.find({ _id: req.params.commentId })
        .then(result => {
            res.status(200).json({ success: true, data: result })
        }).catch(err => next(err))
}

const getAllCommentsFromSinglePost = (req, res, next) => {
    // console.log(req.params.postId, "req.params.postId")
    Comment.find({ postId: req.params.postId })
        .then(result => {
            res.status(200).json({ success: true, data: result })
        }).catch(err => next(err))
}

const deleteSoloComment = (req, res, next) => {
    Comment.findByIdAndDelete({ _id: req.params.commentId })
        .then(() => {
            res.status(200).json({ success: true, msg: "comment deleted" })
        }).catch(err => next(err))
}

const updateSoloCommentText = (req, res, next) => {
    data = req.body;
    let commentId = req.params.commentId;
    // console.log(data, commentId, "check it!!")
    
    Comment.findOne({_id: commentId})
        .then(currentComment => {
            if(data.body) {
                currentComment.body = data.body;
            }

            Comment.findByIdAndUpdate(currentComment._id, currentComment, {})
                .then(() => console.log("comment updated...."))
                .catch(err => next(err))

        }).catch(err => next(err))
    res.status(200).json({success: true, result: []})
}

const updateSoloCommentCounts = (req, res, next) => {
    let data = req.body;
    let commentId = req.params.commentId;

    Comment.findOne({_id: commentId})
        .then(currentComment => {
            let setCounts = (countType, dataType) => {
                currentComment[countType] = currentComment[countType] !== -1 ? data[dataType] : 1
            }
            
            if(data.Like !== undefined) {
                setCounts("likesCount", "Like")
            } 

            if(data.Dislike !== undefined) {
                setCounts("dislikesCount", "Dislike")
            } 

            if(data.Love !== undefined) {
                setCounts("loveCount", "Love")
            }

            let findIdx = currentComment?.engaggedUsers.findIndex(item => data.userId === Object.keys(item)[0])

            if(findIdx !== -1) {
                currentComment.engaggedUsers[findIdx] = {[data.userId]: data.userCounts}
            } else {
                currentComment.engaggedUsers.push({[data.userId]: data.userCounts})
            }

            // console.log(currentComment, "currentComment!!")

            Comment.findByIdAndUpdate(currentComment._id, currentComment, {})
                .then((updatedComment) => {
                    console.log("comment updated!!");
                    res.status(200).json({success: true, result: updatedComment})
                })
                .catch(err => next(err))

        }).catch(err=>next(err))
}

const createNewComment = [
    body("text", "comment body can not be left empty")
        .trim().isLength({ min: 1 }).escape(),

    (req, res, next) => {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(402).json({ success: false, errors: errors.array() })
        }

        // ready to be saved into database
        if (req.body.userId) {
            let newComment = new Comment({
                body: req.body.text,
                userId: req.body.userId,
                postId: req.body.postId,
                created: new Date().toISOString()
            })

            newComment.save((err, comment) => {
                if (err) return next(err)
                // successfully added this comment
                console.log("comment saved!!")
                res.status(200).json({ success: true, comment: comment })
            })
        } else {
            return res.status(402).json({ success: false, msg: "user is not authorized" })
        }
    }
]

module.exports = {
    getAllComments,
    getAllCommentsFromSinglePost,
    getSoloComment,
    createNewComment,
    updateSoloCommentCounts,
    deleteSoloComment,
    updateSoloCommentText
}